import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import boto3  # pyright: ignore[reportMissingImports]
from botocore.exceptions import (  # pyright: ignore[reportMissingImports]
    BotoCoreError,
    ClientError,
)
from PIL import Image

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

        result = subprocess.run(  # noqa: UP022
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


def convert_image(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
) -> str:
    format_aliases = {
        "jpg": "JPEG",
        "jpeg": "JPEG",
        "png": "PNG",
        "webp": "WEBP",
    }

    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }

    output_extensions = {
        "jpg": "jpg",
        "jpeg": "jpg",
        "png": "png",
        "webp": "webp",
    }

    if source_format not in format_aliases:
        raise ValueError(f"Unsupported image source format: {source_format}")

    if target_format not in format_aliases:
        raise ValueError(f"Unsupported image target format: {target_format}")

    output_extension = output_extensions[target_format]
    output_key = f"conversions/{conversion_id}/output.{output_extension}"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / f"input.{source_format}"
        output_path = temp_path / f"output.{output_extension}"

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
            f"Converting image {source_format} -> {target_format}",
            flush=True,
        )

        with Image.open(input_path) as image:
            image.load()

            if target_format in {"jpg", "jpeg"}:
                if image.mode in {"RGBA", "LA"} or (
                    image.mode == "P" and "transparency" in image.info
                ):
                    background = Image.new("RGB", image.size, "white")

                    if image.mode != "RGBA":
                        image = image.convert("RGBA")

                    background.paste(image, mask=image.getchannel("A"))
                    image = background

                elif image.mode != "RGB":
                    image = image.convert("RGB")

            image.save(
                output_path,
                format=format_aliases[target_format],
            )

        if not output_path.exists():
            raise RuntimeError(
                f"Image conversion reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": content_types[target_format],
            },
        )

        print(
            f"Uploaded converted image: {output_key}",
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

    image_formats = {"png", "jpg", "jpeg", "webp"}

    if (
        source_format in image_formats
        and target_format in image_formats
        and source_format != target_format
    ):
        return convert_image(
            s3=s3,
            conversion_id=conversion_id,
            source_format=source_format,
            target_format=target_format,
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

        except Exception as exc:  # noqa: BLE001
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
