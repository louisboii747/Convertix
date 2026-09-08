import base64
import json
import os
from unittest.mock import Mock

import pytest

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
import lambda_base as base  # noqa: E402
import lambda_function as entrypoint  # noqa: E402


def event(path, body):
    return {"requestContext": {"http": {"method": "POST"}}, "rawPath": path, "body": json.dumps(body)}


@pytest.mark.parametrize("handler", [base.lambda_handler, entrypoint.lambda_handler])
@pytest.mark.parametrize("path", ["/uploads", "/conversions"])
@pytest.mark.parametrize("body", [None, [], 123, "text", {"filename": []}, {"input_keys": [None]}])
def test_rejects_non_object_and_invalid_types(handler, path, body):
    assert handler(event(path, body), None)["statusCode"] == 400


@pytest.mark.parametrize("path", ["/uploads", "/conversions"])
def test_body_limit_includes_base64_decoding(path):
    request = event(path, {"padding": "x" * 17000})
    assert entrypoint.lambda_handler(request, None)["statusCode"] == 413
    request["body"] = base64.b64encode(request["body"].encode()).decode()
    request["isBase64Encoded"] = True
    assert entrypoint.lambda_handler(request, None)["statusCode"] == 413


@pytest.mark.parametrize("key", [
    "uploads/../private/input.png", "uploads/test/input.png",
    "uploads/12345678-1234-4234-8234-123456789abc/input.png|uploads/other.png",
    "conversions/12345678-1234-4234-8234-123456789abc/output.png",
])
def test_rejects_malformed_keys_before_queueing(monkeypatch, key):
    sqs = Mock()
    monkeypatch.setattr(base, "sqs", sqs)
    result = entrypoint.lambda_handler(event("/conversions", {"source_format": "png", "target_format": "jpg", "input_key": key}), None)
    assert result["statusCode"] == 400
    sqs.send_message.assert_not_called()


def test_pdf_merge_wrapper_rejects_delimiter_and_path_injection(monkeypatch):
    storage = Mock()
    monkeypatch.setattr(base, "s3", storage)
    result = entrypoint.lambda_handler(event("/conversions", {"operation": "merge_pdf", "input_keys": ["uploads/../secret.pdf", "uploads/test/input.pdf"]}), None)
    assert result["statusCode"] == 400
    storage.head_object.assert_not_called()


def test_api_responses_with_download_capabilities_are_not_cacheable():
    assert base.response(200, {})["headers"]["cache-control"] == "private, no-store"
