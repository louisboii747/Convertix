import json
import os
import sys

import boto3


QUEUE_URL = os.environ.get("QUEUE_URL")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")


def main() -> int:
    if not QUEUE_URL:
        print("QUEUE_URL environment variable is required.", file=sys.stderr)
        return 1

    sqs = boto3.client("sqs", region_name=AWS_REGION)

    print(f"Convertix worker started. Waiting for a job from {QUEUE_URL}")

    response = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=20,
        VisibilityTimeout=900,
    )

    messages = response.get("Messages", [])

    if not messages:
        print("No jobs available. Exiting.")
        return 0

    message = messages[0]

    print("Received Convertix job:")
    print(json.dumps(json.loads(message["Body"]), indent=2))

    # For this first plumbing test only, treat receipt as success.
    sqs.delete_message(
        QueueUrl=QUEUE_URL,
        ReceiptHandle=message["ReceiptHandle"],
    )

    print("Job acknowledged successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
