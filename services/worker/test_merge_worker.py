import merge_worker


def test_non_merge_conversion_passes_batch_input_keys_through(monkeypatch):
    captured = {}

    def fake_process_conversion(**kwargs):
        captured.update(kwargs)
        return "conversions/test/output.pdf"

    monkeypatch.setattr(merge_worker, "_original_process_conversion", fake_process_conversion)

    result = merge_worker.process_conversion(
        s3=object(),
        conversion_id="conversion-1",
        source_format="png",
        target_format="pdf",
        input_key=None,
        input_keys=[
            "uploads/one/input.png",
            "uploads/two/input.png",
        ],
    )

    assert result == "conversions/test/output.pdf"
    assert captured["input_key"] is None
    assert captured["input_keys"] == [
        "uploads/one/input.png",
        "uploads/two/input.png",
    ]


def test_merge_conversion_still_uses_packed_input_key(monkeypatch):
    captured = {}

    def fake_merge_pdf(**kwargs):
        captured.update(kwargs)
        return "conversions/test/output.pdf"

    monkeypatch.setattr(merge_worker, "merge_pdf", fake_merge_pdf)

    result = merge_worker.process_conversion(
        s3=object(),
        conversion_id="conversion-2",
        source_format="pdf",
        target_format="pdf",
        input_key="uploads/one/input.pdf|uploads/two/input.pdf",
        compression_level="merge",
    )

    assert result == "conversions/test/output.pdf"
    assert captured["input_key"] == (
        "uploads/one/input.pdf|uploads/two/input.pdf"
    )
