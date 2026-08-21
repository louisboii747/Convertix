import json
import logging
import uuid

from botocore.exceptions import ClientError  # pyright: ignore[reportMissingImports]

import lambda_base as base

MAX_MERGE_FILES = 20
MAX_MERGE_BYTES = 100 * 1024 * 1024

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _handle_pdf_merge(event):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return base.response(400, {"error": "invalid_json"})

    input_keys = body.get("input_keys")

    if not isinstance(input_keys, list):
        return base.response(400, {"error": "input_keys_required"})

    normalized_keys = [str(item).strip() for item in input_keys]

    if len(normalized_keys) < 2:
        return base.response(400, {"error": "merge_requires_at_least_two_pdfs"})

    if len(normalized_keys) > MAX_MERGE_FILES:
        return base.response(
            400,
            {
                "error": "too_many_merge_inputs",
                "max_files": MAX_MERGE_FILES,
            },
        )

    for input_key in normalized_keys:
        if (
            not input_key
            or "|" in input_key
            or not input_key.startswith("uploads/")
            or not input_key.lower().endswith(".pdf")
        ):
            return base.response(400, {"error": "invalid_merge_input_key"})

    if not base.STORAGE_BUCKET:
        logger.error("STORAGE_BUCKET environment variable is not configured")
        return base.response(500, {"error": "storage_not_configured"})

    total_size = 0

    try:
        for input_key in normalized_keys:
            metadata = base.s3.head_object(
                Bucket=base.STORAGE_BUCKET,
                Key=input_key,
            )
            total_size += int(metadata.get("ContentLength", 0))
    except ClientError:
        logger.exception("Failed to validate one or more PDF merge inputs")
        return base.response(400, {"error": "invalid_merge_input"})

    if total_size > MAX_MERGE_BYTES:
        return base.response(
            400,
            {
                "error": "merge_inputs_too_large",
                "max_bytes": MAX_MERGE_BYTES,
            },
        )

    if not base.QUEUE_URL:
        logger.error("QUEUE_URL environment variable is not configured")
        return base.response(500, {"error": "queue_not_configured"})

    conversion_id = str(uuid.uuid4())
    packed_input_key = "|".join(normalized_keys)

    job = {
        "conversion_id": conversion_id,
        "source_format": "pdf",
        "target_format": "pdf",
        "input_key": packed_input_key,
        "compression_level": "merge",
    }

    try:
        sqs_response = base.sqs.send_message(
            QueueUrl=base.QUEUE_URL,
            MessageBody=json.dumps(job),
        )
    except Exception:
        logger.exception("Failed to queue PDF merge %s", conversion_id)
        return base.response(500, {"error": "failed_to_queue_conversion"})

    logger.info(
        "Queued PDF merge %s as SQS message %s with %s inputs",
        conversion_id,
        sqs_response.get("MessageId"),
        len(normalized_keys),
    )

    return base.response(
        202,
        {
            "conversion_id": conversion_id,
            "source_format": "pdf",
            "target_format": "pdf",
            "status": "queued",
            "operation": "merge_pdf",
            "input_count": len(normalized_keys),
        },
    )


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("rawPath")

    if method == "POST" and path == "/conversions":
        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return base.lambda_handler(event, context)

        if isinstance(body, dict) and body.get("operation") == "merge_pdf":
            return _handle_pdf_merge(event)

    return base.lambda_handler(event, context)
