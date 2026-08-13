import json
import os
import signal
import sys
import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError

QUEUE_URL = os.environ.get("QUEUE_URL")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")

shutdown_requested = False


def handle_shutdown(signum, frame) -> None:
    global shutdown_requested
    shutdown_requested = True
    print(
        f"Shutdown signal {signum} received. Finishing current work...",
        flush=True,
    )


def main() -> int:
    if not QUEUE_URL:
        print(
            "QUEUE_URL environment variable is required.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    sqs = boto3.client("sqs", region_name=AWS_REGION)

    print(
        f"Convertix worker started. Long-polling {QUEUE_URL}",
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

            conversion_id = body.get("conversion_id", "unknown")
            source_format = body.get("source_format", "unknown")
            target_format = body.get("target_format", "unknown")

            print(
                (
                    f"Received conversion job "
                    f"{conversion_id}: "
                    f"{source_format} -> {target_format} "
                    f"(SQS message {message_id})"
                ),
                flush=True,
            )

            print(
                f"Processing conversion {conversion_id}...",
                flush=True,
            )

            # Temporary plumbing-test behaviour.
            # Real conversion processing will go here next.

            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )

            print(
                (
                    f"Conversion job acknowledged successfully: "
                    f"{conversion_id} "
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

        except (BotoCoreError, ClientError) as exc:
            print(
                (
                    f"Failed while processing or acknowledging "
                    f"SQS message {message_id}: {exc}"
                ),
                file=sys.stderr,
                flush=True,
            )

        except Exception as exc:
            print(
                (f"Unexpected error while processing SQS message {message_id}: {exc}"),
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
