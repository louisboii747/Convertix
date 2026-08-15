import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError


QUEUE_URL = os.environ.get("QUEUE_URL")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET")

shutdown_requested = False


def handle_shutdown(signum, frame) -> None:
    global shutdown_requested
    shutdown_requested = True

    print(
        f"Shutdown signal {signum} received. Finishing current work...",
        flush=True,
    )


def convert_docx_to_pdf(
    s3,
    conversion_id: str,
    input_key: str,
) -> str:
    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.docx"
        output_path = temp_path / "input.pdf"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        print(
            f"Downloaded input to {input_path}",
            flush=True,
        )

        command = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            str(temp_path),
            str(input_path),
        ]

        print(
            f"Running LibreOffice conversion for {conversion_id}...",
            flush=True,
        )

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stdout:
            print(
                f"LibreOffice stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"LibreOffice stderr: {result.stderr.strip()}",
                file=sys.stderr,
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"LibreOffice reported success but {output_path} was not created"
            )

        print(
            f"Uploading PDF to s3://{STORAGE_BUCKET}/{output_key}",
            flush=True,
        )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": "application/pdf",
            },
        )

        print(
            f"Uploaded converted PDF: {output_key}",
            flush=True,
        )

    return output_key


def process_conversion(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
) -> str:
    source_format = source_format.lower()
    target_format = target_format.lower()

    if source_format == "docx" and target_format == "pdf":
        return convert_docx_to_pdf(
            s3=s3,
            conversion_id=conversion_id,
            input_key=input_key,
        )

    raise ValueError(f"Unsupported conversion: {source_format} -> {target_format}")


def main() -> int:
    if not QUEUE_URL:
        print(
            "QUEUE_URL environment variable is required.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    if not STORAGE_BUCKET:
        print(
            "STORAGE_BUCKET environment variable is required.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    sqs = boto3.client(
        "sqs",
        region_name=AWS_REGION,
    )

    s3 = boto3.client(
        "s3",
        region_name=AWS_REGION,
    )

    print(
        f"Convertix worker started. Long-polling {QUEUE_URL}",
        flush=True,
    )

    print(
        f"Using storage bucket {STORAGE_BUCKET}",
        flush=True,
    )

    while not shutdown_requested:
        try:
            response = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=900,
            )

        except (BotoCoreError, ClientError) as exc:
            print(
                f"Failed to receive SQS message: {exc}",
                file=sys.stderr,
                flush=True,
            )

            if shutdown_requested:
                break

            time.sleep(5)
            continue

        messages = response.get("Messages", [])

        if not messages:
            print(
                "No jobs available. Continuing to poll.",
                flush=True,
            )
            continue

        message = messages[0]
        message_id = message.get("MessageId", "unknown")

        try:
            body = json.loads(message["Body"])

            conversion_id = body.get("conversion_id")
            source_format = body.get("source_format")
            target_format = body.get("target_format")
            input_key = body.get("input_key")

            required_fields = {
                "conversion_id": conversion_id,
                "source_format": source_format,
                "target_format": target_format,
                "input_key": input_key,
            }

            missing = [name for name, value in required_fields.items() if not value]

            if missing:
                raise ValueError(f"Missing required job fields: {', '.join(missing)}")

            print(
                (
                    f"Received conversion job "
                    f"{conversion_id}: "
                    f"{source_format} -> {target_format} "
                    f"(SQS message {message_id})"
                ),
                flush=True,
            )

            output_key = process_conversion(
                s3=s3,
                conversion_id=conversion_id,
                source_format=source_format,
                target_format=target_format,
                input_key=input_key,
            )

            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )

            print(
                (
                    f"Conversion completed successfully: "
                    f"{conversion_id} "
                    f"-> {output_key} "
                    f"(SQS message {message_id})"
                ),
                flush=True,
            )

        except json.JSONDecodeError:
            print(
                (
                    f"Received SQS message {message_id} with invalid JSON. "
                    "Leaving it in the queue."
                ),
                file=sys.stderr,
                flush=True,
            )

        except (
            BotoCoreError,
            ClientError,
            subprocess.SubprocessError,
            ValueError,
            RuntimeError,
        ) as exc:
            print(
                (
                    f"Conversion failed for SQS message "
                    f"{message_id}: {exc}. "
                    "Leaving message in queue for retry."
                ),
                file=sys.stderr,
                flush=True,
            )

        except Exception as exc:
            print(
                (
                    f"Unexpected error while processing SQS message "
                    f"{message_id}: {exc}. "
                    "Leaving message in queue for retry."
                ),
                file=sys.stderr,
                flush=True,
            )

    print(
        "Convertix worker shutting down cleanly.",
        flush=True,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
