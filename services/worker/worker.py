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
    print(f"Shutdown signal {signum} received. Finishing current work...")


def main() -> int:
    if not QUEUE_URL:
        print("QUEUE_URL environment variable is required.", file=sys.stderr)
        return 1

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    sqs = boto3.client("sqs", region_name=AWS_REGION)

    print(f"Convertix worker started. Long-polling {QUEUE_URL}")

    while not shutdown_requested:
        try:
            response = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                VisibilityTimeout=900,
            )
        except (BotoCoreError, ClientError) as exc:
            print(f"Failed to receive SQS message: {exc}", file=sys.stderr)

            if shutdown_requested:
                break

            time.sleep(5)
            continue

        messages = response.get("Messages", [])

        if not messages:
            print("No jobs available. Continuing to poll.")
            continue

        message = messages[0]

        try:
            body = json.loads(message["Body"])

            print("Received Convertix job:")
            print(json.dumps(body, indent=2))

            # Temporary plumbing-test behaviour.
            # Real conversion processing will go here next.

            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )

            print("Job acknowledged successfully.")

        except json.JSONDecodeError:
            print(
                "Received message with invalid JSON. Leaving it in the queue.",
                file=sys.stderr,
            )

        except (BotoCoreError, ClientError) as exc:
            print(
                f"Failed while processing or acknowledging job: {exc}",
                file=sys.stderr,
            )

        except Exception as exc:
            print(
                f"Unexpected error while processing job: {exc}",
                file=sys.stderr,
            )

    print("Convertix worker shutting down cleanly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
