import json
import logging
import os
import uuid

import boto3  # pyright: ignore[reportMissingImports]
from botocore.config import Config  # pyright: ignore[reportMissingImports]
from botocore.exceptions import ClientError  # pyright: ignore[reportMissingImports]

# Environment variables
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")
QUEUE_URL = os.environ.get("QUEUE_URL")


# AWS clients
s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    endpoint_url=f"https://s3.{AWS_REGION}.amazonaws.com",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"},
    ),
)

sqs = boto3.client(
    "sqs",
    region_name=AWS_REGION,
)


# Formats Convertix knows about
SUPPORTED_FORMATS = {
    "pdf",
    "docx",
    "txt",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "mp3",
    "wav",
    "mp4",
    "webm",
}


# Conversion routes that are actually implemented
SUPPORTED_CONVERSIONS = {
    ("docx", "pdf"),
    ("txt", "pdf"),
    ("txt", "docx"),
    ("png", "jpg"),
    ("png", "jpeg"),
    ("png", "webp"),
    ("jpg", "png"),
    ("jpg", "webp"),
    ("jpeg", "png"),
    ("jpeg", "webp"),
    ("webp", "png"),
    ("webp", "jpg"),
    ("webp", "jpeg"),
}


# File types that can currently be uploaded
UPLOAD_FORMATS = {
    "docx",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "txt",
}


# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "content-type": "application/json",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method")

    path = event.get("rawPath")

    # ---------------------------------------------------------
    # GET /health
    # ---------------------------------------------------------

    if method == "GET" and path == "/health":
        return response(
            200,
            {
                "status": "ok",
                "service": "convertix-api",
                "environment": "dev",
            },
        )

    # ---------------------------------------------------------
    # POST /uploads
    # ---------------------------------------------------------

    if method == "POST" and path == "/uploads":
        try:
            body = json.loads(event.get("body") or "{}")

        except json.JSONDecodeError:
            return response(
                400,
                {
                    "error": "invalid_json",
                },
            )

        filename = str(body.get("filename", "")).strip()

        content_type = str(
            body.get(
                "content_type",
                "application/octet-stream",
            )
        ).strip()

        if not filename:
            return response(
                400,
                {
                    "error": "filename_required",
                },
            )

        filename_parts = filename.rsplit(".", 1)

        if len(filename_parts) != 2:
            return response(
                400,
                {
                    "error": "file_extension_required",
                },
            )

        source_format = filename_parts[1].lower()

        if source_format not in UPLOAD_FORMATS:
            return response(
                400,
                {
                    "error": "unsupported_upload_format",
                    "format": source_format,
                },
            )

        if not STORAGE_BUCKET:
            logger.error("STORAGE_BUCKET environment variable is not configured")

            return response(
                500,
                {
                    "error": "storage_not_configured",
                },
            )

        upload_id = str(uuid.uuid4())

        object_key = f"uploads/{upload_id}/input.{source_format}"

        try:
            upload_url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": STORAGE_BUCKET,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=900,
            )

        except Exception:
            logger.exception(
                "Failed to create upload URL for %s",
                upload_id,
            )

            return response(
                500,
                {
                    "error": "failed_to_create_upload_url",
                },
            )

        logger.info(
            "Created upload URL for %s at %s",
            upload_id,
            object_key,
        )

        return response(
            200,
            {
                "upload_id": upload_id,
                "object_key": object_key,
                "upload_url": upload_url,
                "expires_in": 900,
            },
        )

    # ---------------------------------------------------------
    # GET /conversions/{conversion_id}
    # ---------------------------------------------------------

    if method == "GET" and path.startswith("/conversions/"):
        path_parameters = event.get("pathParameters") or {}

        conversion_id = str(path_parameters.get("conversion_id", "")).strip()

        if not conversion_id:
            return response(
                400,
                {
                    "error": "conversion_id_required",
                },
            )

        try:
            uuid.UUID(conversion_id)

        except ValueError:
            return response(
                400,
                {
                    "error": "invalid_conversion_id",
                },
            )

        if not STORAGE_BUCKET:
            logger.error("STORAGE_BUCKET environment variable is not configured")

            return response(
                500,
                {
                    "error": "storage_not_configured",
                },
            )

        output_prefix = f"conversions/{conversion_id}/"

        try:
            objects = s3.list_objects_v2(
                Bucket=STORAGE_BUCKET,
                Prefix=output_prefix,
                MaxKeys=2,
            )

            matching_objects = [
                item
                for item in objects.get("Contents", [])
                if item["Key"].startswith(f"{output_prefix}output.")
            ]

            if not matching_objects:
                return response(
                    200,
                    {
                        "conversion_id": conversion_id,
                        "status": "processing",
                    },
                )

            output_key = matching_objects[0]["Key"]

            object_metadata = s3.head_object(
                Bucket=STORAGE_BUCKET,
                Key=output_key,
            )

        except ClientError:
            logger.exception(
                "Failed to check conversion %s",
                conversion_id,
            )

            return response(
                500,
                {
                    "error": "failed_to_check_conversion",
                },
            )

        output_extension = output_key.rsplit(".", 1)[-1].lower()

        content_type = object_metadata.get(
            "ContentType",
            "application/octet-stream",
        )

        try:
            download_url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": STORAGE_BUCKET,
                    "Key": output_key,
                    "ResponseContentType": content_type,
                    "ResponseContentDisposition": (
                        f"attachment; "
                        f'filename="convertix-{conversion_id}.{output_extension}"'
                    ),
                },
                ExpiresIn=900,
            )

        except Exception:
            logger.exception(
                "Failed to create download URL for conversion %s",
                conversion_id,
            )

            return response(
                500,
                {
                    "error": "failed_to_create_download_url",
                },
            )

        return response(
            200,
            {
                "conversion_id": conversion_id,
                "status": "completed",
                "output_key": output_key,
                "content_type": content_type,
                "size": object_metadata.get("ContentLength"),
                "download_url": download_url,
                "download_expires_in": 900,
            },
        )

    # ---------------------------------------------------------
    # POST /conversions
    # ---------------------------------------------------------

    if method == "POST" and path == "/conversions":
        try:
            body = json.loads(event.get("body") or "{}")

        except json.JSONDecodeError:
            return response(
                400,
                {
                    "error": "invalid_json",
                },
            )

        source_format = str(body.get("source_format", "")).lower().strip()

        target_format = str(body.get("target_format", "")).lower().strip()

        input_key = str(body.get("input_key", "")).strip()

        if not source_format:
            return response(
                400,
                {
                    "error": "source_format_required",
                },
            )

        if not target_format:
            return response(
                400,
                {
                    "error": "target_format_required",
                },
            )

        if source_format not in SUPPORTED_FORMATS:
            return response(
                400,
                {
                    "error": "unsupported_source_format",
                    "format": source_format,
                },
            )

        if target_format not in SUPPORTED_FORMATS:
            return response(
                400,
                {
                    "error": "unsupported_target_format",
                    "format": target_format,
                },
            )

        if source_format == target_format:
            return response(
                400,
                {
                    "error": "source_and_target_formats_are_identical",
                },
            )

        if (
            source_format,
            target_format,
        ) not in SUPPORTED_CONVERSIONS:
            return response(
                400,
                {
                    "error": "unsupported_conversion",
                    "source_format": source_format,
                    "target_format": target_format,
                },
            )

        if not input_key:
            return response(
                400,
                {
                    "error": "input_key_required",
                },
            )

        if not input_key.startswith("uploads/"):
            return response(
                400,
                {
                    "error": "invalid_input_key",
                },
            )

        expected_extensions = {
            source_format,
        }

        if source_format == "jpg":
            expected_extensions.add("jpeg")

        if source_format == "jpeg":
            expected_extensions.add("jpg")

        if not any(
            input_key.lower().endswith(f".{extension}")
            for extension in expected_extensions
        ):
            return response(
                400,
                {
                    "error": "input_format_mismatch",
                    "source_format": source_format,
                },
            )

        if not QUEUE_URL:
            logger.error("QUEUE_URL environment variable is not configured")

            return response(
                500,
                {
                    "error": "queue_not_configured",
                },
            )

        conversion_id = str(uuid.uuid4())

        job = {
            "conversion_id": conversion_id,
            "source_format": source_format,
            "target_format": target_format,
            "input_key": input_key,
        }

        try:
            sqs_response = sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(job),
            )

        except Exception:
            logger.exception(
                "Failed to queue conversion %s",
                conversion_id,
            )

            return response(
                500,
                {
                    "error": "failed_to_queue_conversion",
                },
            )

        logger.info(
            "Queued conversion %s as SQS message %s",
            conversion_id,
            sqs_response.get("MessageId"),
        )

        return response(
            202,
            {
                "conversion_id": conversion_id,
                "source_format": source_format,
                "target_format": target_format,
                "input_key": input_key,
                "status": "queued",
            },
        )

    # ---------------------------------------------------------
    # Unknown route
    # ---------------------------------------------------------

    return response(
        404,
        {
            "error": "not_found",
        },
    )
