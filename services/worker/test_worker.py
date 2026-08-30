import importlib.util
from io import BytesIO
from pathlib import Path

import pytest
from PIL import Image
from pillow_heif import libheif_info


WORKER_PATH = Path(__file__).with_name("worker.py")
spec = importlib.util.spec_from_file_location("convertix_worker", WORKER_PATH)
worker = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(worker)


def test_handle_shutdown_sets_flag():
    worker.shutdown_requested = False

    worker.handle_shutdown(15, None)

    assert worker.shutdown_requested is True


def test_default_region_is_london():
    assert worker.AWS_REGION == "eu-west-2"


def test_shutdown_flag_defaults_to_false():
    worker.shutdown_requested = False
    assert worker.shutdown_requested is False


def test_bundled_libheif_has_hevc_decoder():
    library_info = libheif_info()

    assert library_info["libheif"] == "1.23.1"
    assert "libde265" in library_info["decoders"]


class FakeS3:
    def __init__(self, input_bytes):
        self.input_bytes = input_bytes
        self.uploaded_bytes = None
        self.upload_args = None

    def download_file(self, bucket, key, filename):
        Path(filename).write_bytes(self.input_bytes)

    def upload_file(self, filename, bucket, key, ExtraArgs=None):
        self.uploaded_bytes = Path(filename).read_bytes()
        self.upload_args = {
            "bucket": bucket,
            "key": key,
            "extra_args": ExtraArgs,
        }


def make_image_bytes(image_format, mode="RGBA"):
    color = (20, 80, 160, 96) if mode == "RGBA" else (20, 80, 160)
    image = Image.new(mode, (6, 4), color)
    output = BytesIO()
    image.save(output, format=image_format)
    image.close()
    return output.getvalue()


def make_oriented_jpeg_bytes():
    image = Image.new("RGB", (2, 3), (20, 80, 160))
    exif = Image.Exif()
    exif[274] = 6
    output = BytesIO()
    image.save(output, format="JPEG", exif=exif)
    image.close()
    return output.getvalue()


def convert_bytes(monkeypatch, input_bytes, source_format, target_format):
    s3 = FakeS3(input_bytes)
    monkeypatch.setattr(worker, "STORAGE_BUCKET", "convertix-test")
    output_key = worker.convert_image(
        s3=s3,
        conversion_id="conversion-1",
        source_format=source_format,
        target_format=target_format,
        input_key=f"uploads/test/input.{source_format}",
    )
    assert s3.uploaded_bytes is not None
    return output_key, s3


@pytest.mark.parametrize(
    ("target_format", "expected_pillow_format", "expected_content_type"),
    [
        ("jpg", "JPEG", "image/jpeg"),
        ("png", "PNG", "image/png"),
        ("webp", "WEBP", "image/webp"),
    ],
)
def test_heic_converts_to_supported_raster_formats(
    monkeypatch,
    target_format,
    expected_pillow_format,
    expected_content_type,
):
    output_key, s3 = convert_bytes(
        monkeypatch,
        make_image_bytes("HEIF"),
        "heic",
        target_format,
    )

    with Image.open(BytesIO(s3.uploaded_bytes)) as output_image:
        output_image.load()
        assert output_image.format == expected_pillow_format
        assert output_image.size == (6, 4)

    assert output_key.endswith(f"output.{target_format}")
    assert s3.upload_args["extra_args"]["ContentType"] == expected_content_type


def test_heif_source_is_recognised_case_insensitively(monkeypatch):
    monkeypatch.setattr(worker, "STORAGE_BUCKET", "convertix-test")
    output_key = worker.process_conversion(
        s3=FakeS3(make_image_bytes("HEIF", mode="RGB")),
        conversion_id="conversion-2",
        source_format="HEIF",
        target_format="PNG",
        input_key="uploads/test/input.HEIF",
    )

    assert output_key.endswith("output.png")


def test_heic_alpha_is_preserved_for_png(monkeypatch):
    _, s3 = convert_bytes(
        monkeypatch,
        make_image_bytes("HEIF"),
        "heic",
        "png",
    )

    with Image.open(BytesIO(s3.uploaded_bytes)) as output_image:
        output_image.load()
        assert output_image.mode == "RGBA"
        assert output_image.getpixel((0, 0))[3] < 255


def test_content_detection_overrides_misleading_jpeg_declaration(monkeypatch):
    _, s3 = convert_bytes(
        monkeypatch,
        make_image_bytes("HEIF", mode="RGB"),
        "jpg",
        "png",
    )

    with Image.open(BytesIO(s3.uploaded_bytes)) as output_image:
        assert output_image.format == "PNG"


def test_existing_png_to_jpeg_conversion_still_works(monkeypatch):
    _, s3 = convert_bytes(
        monkeypatch,
        make_image_bytes("PNG"),
        "png",
        "jpg",
    )

    with Image.open(BytesIO(s3.uploaded_bytes)) as output_image:
        output_image.load()
        assert output_image.format == "JPEG"
        assert output_image.mode == "RGB"


@pytest.mark.parametrize(
    ("source_format", "image_format", "mode"),
    [
        ("jpg", "JPEG", "RGB"),
        ("png", "PNG", "RGBA"),
    ],
)
def test_jpg_and_png_convert_to_pdf(
    monkeypatch,
    source_format,
    image_format,
    mode,
):
    s3 = FakeS3(make_image_bytes(image_format, mode=mode))
    monkeypatch.setattr(worker, "STORAGE_BUCKET", "convertix-test")

    output_key = worker.process_conversion(
        s3=s3,
        conversion_id="conversion-pdf",
        source_format=source_format,
        target_format="pdf",
        input_key=f"uploads/test/input.{source_format}",
    )

    assert output_key.endswith("output.pdf")
    assert s3.uploaded_bytes is not None
    assert s3.uploaded_bytes.startswith(b"%PDF")
    assert s3.upload_args["extra_args"]["ContentType"] == "application/pdf"


def test_image_pdf_page_preserves_aspect_ratio_without_cropping():
    image = Image.new("RGBA", (1200, 600), (20, 80, 160, 96))
    page = worker.render_image_pdf_page(image)

    try:
        assert page.mode == "RGB"
        assert page.size == (
            worker.PDF_PAGE_LONG_EDGE,
            worker.PDF_PAGE_SHORT_EDGE,
        )
        assert page.getpixel((0, 0)) == (255, 255, 255)
    finally:
        page.close()
        image.close()


def test_exif_orientation_is_applied_before_conversion(monkeypatch):
    _, s3 = convert_bytes(
        monkeypatch,
        make_oriented_jpeg_bytes(),
        "jpg",
        "png",
    )

    with Image.open(BytesIO(s3.uploaded_bytes)) as output_image:
        output_image.load()
        assert output_image.size == (3, 2)
        assert output_image.getexif().get(274) in {None, 1}


def test_corrupt_heic_fails_cleanly(monkeypatch):
    s3 = FakeS3(b"not-a-valid-heic-file")
    monkeypatch.setattr(worker, "STORAGE_BUCKET", "convertix-test")

    with pytest.raises(ValueError, match="Invalid or unsupported HEIC image data"):
        worker.convert_image(
            s3=s3,
            conversion_id="conversion-3",
            source_format="heic",
            target_format="jpg",
            input_key="uploads/test/input.heic",
        )

    assert s3.uploaded_bytes is None
