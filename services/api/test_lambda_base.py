import json
import os
from unittest.mock import Mock

import pytest

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")

import lambda_base  # noqa: E402


def make_event(method, path, body=None):
    return {
        "requestContext": {"http": {"method": method}},
        "rawPath": path,
        "body": json.dumps(body) if body is not None else None,
    }


def response_body(result):
    return json.loads(result["body"])


@pytest.mark.parametrize(
    ("filename", "expected_format", "expected_content_type"),
    [
        ("IMG_0001.HEIC", "heic", "image/heic"),
        ("photo.HeIf", "heif", "image/heif"),
    ],
)
def test_upload_recognises_heif_extensions_and_normalises_mime(
    monkeypatch,
    filename,
    expected_format,
    expected_content_type,
):
    s3 = Mock()
    s3.generate_presigned_url.return_value = "https://upload.example.test"
    monkeypatch.setattr(lambda_base, "s3", s3)
    monkeypatch.setattr(lambda_base, "STORAGE_BUCKET", "convertix-test")

    result = lambda_base.lambda_handler(
        make_event(
            "POST",
            "/uploads",
            {"filename": filename, "content_type": "image/jpeg"},
        ),
        None,
    )

    body = response_body(result)
    assert result["statusCode"] == 200
    assert body["object_key"].endswith(f"/input.{expected_format}")
    assert body["content_type"] == expected_content_type
    assert (
        s3.generate_presigned_url.call_args.kwargs["Params"]["ContentType"]
        == expected_content_type
    )


@pytest.mark.parametrize("source_format", ["heic", "heif"])
@pytest.mark.parametrize("target_format", ["jpg", "jpeg", "png", "webp"])
def test_heif_conversions_are_accepted(
    monkeypatch,
    source_format,
    target_format,
):
    sqs = Mock()
    sqs.send_message.return_value = {"MessageId": "message-1"}
    monkeypatch.setattr(lambda_base, "sqs", sqs)
    monkeypatch.setattr(lambda_base, "QUEUE_URL", "https://sqs.example.test/queue")

    result = lambda_base.lambda_handler(
        make_event(
            "POST",
            "/conversions",
            {
                "source_format": source_format.upper(),
                "target_format": target_format.upper(),
                "input_key": f"uploads/test/input.{source_format.upper()}",
            },
        ),
        None,
    )

    body = response_body(result)
    assert result["statusCode"] == 202
    assert body["source_format"] == source_format
    assert body["target_format"] == target_format
    queued = json.loads(sqs.send_message.call_args.kwargs["MessageBody"])
    assert queued["source_format"] == source_format
    assert queued["target_format"] == target_format


def test_existing_image_conversion_remains_accepted(monkeypatch):
    sqs = Mock()
    sqs.send_message.return_value = {"MessageId": "message-2"}
    monkeypatch.setattr(lambda_base, "sqs", sqs)
    monkeypatch.setattr(lambda_base, "QUEUE_URL", "https://sqs.example.test/queue")

    result = lambda_base.lambda_handler(
        make_event(
            "POST",
            "/conversions",
            {
                "source_format": "jpg",
                "target_format": "png",
                "input_key": "uploads/test/input.jpeg",
            },
        ),
        None,
    )

    assert result["statusCode"] == 202
