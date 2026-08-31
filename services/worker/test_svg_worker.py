import svg_worker


def test_non_svg_conversion_passes_batch_input_keys_through(monkeypatch):
    captured = {}

    def fake_process_conversion(**kwargs):
        captured.update(kwargs)
        return "conversions/test/output.pdf"

    monkeypatch.setattr(svg_worker, "_original_process_conversion", fake_process_conversion)

    result = svg_worker.process_conversion(
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
