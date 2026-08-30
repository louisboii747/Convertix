import json
import os
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import boto3  # pyright: ignore[reportMissingImports]
from botocore.exceptions import (  # pyright: ignore[reportMissingImports]
    BotoCoreError,
    ClientError,
)
from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener

register_heif_opener(thumbnails=False)

QUEUE_URL = os.environ.get("QUEUE_URL")
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET")

shutdown_requested = False

FAILURE_MARKER_NAME = "failure.json"


def record_conversion_failure(s3, conversion_id: str, exc: Exception) -> None:
    failure_key = f"conversions/{conversion_id}/{FAILURE_MARKER_NAME}"
    payload = {
        "status": "failed",
        "error_type": type(exc).__name__,
        "error": str(exc)[:1000],
    }

    try:
        s3.put_object(
            Bucket=STORAGE_BUCKET,
            Key=failure_key,
            Body=json.dumps(payload).encode("utf-8"),
            ContentType="application/json",
        )
        print(
            f"Recorded conversion failure: {conversion_id} -> {failure_key}",
            file=sys.stderr,
            flush=True,
        )
    except (BotoCoreError, ClientError) as marker_exc:
        print(
            f"Failed to record conversion failure for {conversion_id}: {marker_exc}",
            file=sys.stderr,
            flush=True,
        )


def clear_conversion_failure(s3, conversion_id: str) -> None:
    failure_key = f"conversions/{conversion_id}/{FAILURE_MARKER_NAME}"

    try:
        s3.delete_object(Bucket=STORAGE_BUCKET, Key=failure_key)
    except (BotoCoreError, ClientError) as marker_exc:
        print(
            f"Failed to clear conversion failure marker for {conversion_id}: {marker_exc}",
            file=sys.stderr,
            flush=True,
        )


def handle_shutdown(signum, frame) -> None:
    global shutdown_requested
    shutdown_requested = True

    print(
        f"Shutdown signal {signum} received. Finishing current work...",
        flush=True,
    )


def convert_docx_to_pdf(
    s3,
    conversion_id: str,
    input_key: str,
) -> str:
    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.docx"
        output_path = temp_path / "input.pdf"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        print(
            f"Downloaded input to {input_path}",
            flush=True,
        )

        command = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            str(temp_path),
            str(input_path),
        ]

        print(
            f"Running LibreOffice conversion for {conversion_id}...",
            flush=True,
        )

        result = subprocess.run(  # noqa: UP022
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stdout:
            print(
                f"LibreOffice stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"LibreOffice stderr: {result.stderr.strip()}",
                file=sys.stderr,
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"LibreOffice reported success but {output_path} was not created"
            )

        print(
            f"Uploading PDF to s3://{STORAGE_BUCKET}/{output_key}",
            flush=True,
        )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": "application/pdf",
            },
        )

        print(
            f"Uploaded converted PDF: {output_key}",
            flush=True,
        )

    return output_key


def convert_xlsx_to_pdf(
    s3,
    conversion_id: str,
    input_key: str,
) -> str:
    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.xlsx"
        output_path = temp_path / "input.pdf"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        print(
            f"Converting XLSX -> PDF for {conversion_id}...",
            flush=True,
        )

        command = [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf:calc_pdf_Export",
            "--outdir",
            str(temp_path),
            str(input_path),
        ]

        result = subprocess.run(  # noqa: UP022
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stdout:
            print(
                f"LibreOffice stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"LibreOffice stderr: {result.stderr.strip()}",
                file=sys.stderr,
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"LibreOffice reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": "application/pdf",
            },
        )

        print(
            f"Uploaded converted spreadsheet: {output_key}",
            flush=True,
        )

    return output_key


def compress_pdf(
    s3,
    conversion_id: str,
    input_key: str,
    compression_level: str = "balanced",
) -> str:
    compression_presets = {
        "light": "/prepress",
        "balanced": "/ebook",
        "maximum": "/screen",
    }

    if compression_level not in compression_presets:
        raise ValueError(f"Unsupported PDF compression level: {compression_level}")

    preset = compression_presets[compression_level]
    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.pdf"
        output_path = temp_path / "compressed.pdf"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        original_size = input_path.stat().st_size

        print(
            f"Compressing PDF with {compression_level} preset for {conversion_id}...",
            flush=True,
        )

        command = [
            "gs",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={preset}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path),
        ]

        result = subprocess.run(  # noqa: UP022
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stdout:
            print(
                f"Ghostscript stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"Ghostscript stderr: {result.stderr.strip()}",
                file=sys.stderr,
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"Ghostscript exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                "Ghostscript reported success but compressed.pdf was not created"
            )

        compressed_size = output_path.stat().st_size

        print(
            f"PDF compression complete: {original_size} -> {compressed_size} bytes",
            flush=True,
        )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": "application/pdf",
            },
        )

        print(
            f"Uploaded compressed PDF: {output_key}",
            flush=True,
        )

    return output_key


def convert_txt_document(
    s3,
    conversion_id: str,
    target_format: str,
    input_key: str,
) -> str:
    output_formats = {
        "pdf": {
            "extension": "pdf",
            "libreoffice_format": "pdf:writer_pdf_Export",
            "content_type": "application/pdf",
        },
        "docx": {
            "extension": "docx",
            "libreoffice_format": "docx:Office Open XML Text",
            "content_type": (
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        },
    }

    if target_format not in output_formats:
        raise ValueError(f"Unsupported TXT target format: {target_format}")

    output_config = output_formats[target_format]
    output_extension = output_config["extension"]

    output_key = f"conversions/{conversion_id}/output.{output_extension}"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.txt"
        output_path = temp_path / f"input.{output_extension}"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        print(
            f"Converting TXT -> {target_format.upper()} for {conversion_id}...",
            flush=True,
        )

        command = [
            "libreoffice",
            "--headless",
            "--convert-to",
            output_config["libreoffice_format"],
            "--outdir",
            str(temp_path),
            str(input_path),
        ]

        result = subprocess.run(  # noqa: UP022
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stdout:
            print(
                f"LibreOffice stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"LibreOffice stderr: {result.stderr.strip()}",
                file=sys.stderr,
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"LibreOffice reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": output_config["content_type"],
            },
        )

        print(
            f"Uploaded converted document: {output_key}",
            flush=True,
        )

    return output_key


IMAGE_INPUT_FORMATS = {"jpg", "jpeg", "png", "webp", "heic", "heif"}
IMAGE_TARGET_FORMATS = {"jpg", "jpeg", "png", "webp"}

PDF_PAGE_SHORT_EDGE = 1240
PDF_PAGE_LONG_EDGE = 1754
PDF_PAGE_MARGIN = 80
PDF_PAGE_RESOLUTION = 150.0


def normalize_decoded_image_format(image_format: str | None) -> str | None:
    return {
        "JPEG": "jpg",
        "PNG": "png",
        "WEBP": "webp",
        "HEIF": "heif",
    }.get((image_format or "").upper())


def image_save_metadata(image: Image.Image, target_format: str) -> dict:
    metadata_keys = ["exif", "icc_profile"]

    if target_format == "webp":
        metadata_keys.append("xmp")

    return {
        key: image.info[key]
        for key in metadata_keys
        if image.info.get(key) is not None
    }


def image_has_alpha(image: Image.Image) -> bool:
    return "A" in image.getbands() or (
        image.mode == "P" and "transparency" in image.info
    )


def render_image_pdf_page(image: Image.Image) -> Image.Image:
    landscape = image.width > image.height
    page_size = (
        (PDF_PAGE_LONG_EDGE, PDF_PAGE_SHORT_EDGE)
        if landscape
        else (PDF_PAGE_SHORT_EDGE, PDF_PAGE_LONG_EDGE)
    )
    max_size = (
        page_size[0] - (PDF_PAGE_MARGIN * 2),
        page_size[1] - (PDF_PAGE_MARGIN * 2),
    )

    rendered = image.convert("RGBA" if image_has_alpha(image) else "RGB")
    rendered.thumbnail(max_size, Image.Resampling.LANCZOS)

    page = Image.new("RGB", page_size, "white")
    offset = (
        (page_size[0] - rendered.width) // 2,
        (page_size[1] - rendered.height) // 2,
    )

    if rendered.mode == "RGBA":
        page.paste(rendered, offset, rendered)
    else:
        page.paste(rendered, offset)

    rendered.close()
    return page


def convert_images_to_pdf(
    s3,
    conversion_id: str,
    inputs: list[tuple[str, str]],
) -> str:
    if not inputs:
        raise ValueError("At least one image is required for PDF conversion")

    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)
        output_path = temp_path / "output.pdf"
        pages: list[Image.Image] = []

        try:
            for index, (source_format, input_key) in enumerate(inputs):
                source_format = source_format.lower()

                if source_format not in IMAGE_INPUT_FORMATS:
                    raise ValueError(
                        f"Unsupported image source format for PDF: {source_format}"
                    )

                input_path = temp_path / f"input-{index}.{source_format}"

                print(
                    f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
                    flush=True,
                )

                s3.download_file(
                    STORAGE_BUCKET,
                    input_key,
                    str(input_path),
                )

                try:
                    with Image.open(input_path) as opened_image:
                        detected_format = normalize_decoded_image_format(
                            opened_image.format
                        )

                        if detected_format not in IMAGE_INPUT_FORMATS:
                            raise ValueError(
                                "Unsupported decoded image format: "
                                f"{opened_image.format or 'unknown'}"
                            )

                        opened_image.load()
                        image = ImageOps.exif_transpose(opened_image)

                except (
                    EOFError,
                    OSError,
                    RuntimeError,
                    SyntaxError,
                    UnidentifiedImageError,
                    ValueError,
                ) as exc:
                    raise ValueError(
                        f"Invalid or unsupported {source_format.upper()} image data"
                    ) from exc

                try:
                    pages.append(render_image_pdf_page(image))
                finally:
                    image.close()

            first_page, *remaining_pages = pages
            first_page.save(
                output_path,
                format="PDF",
                save_all=True,
                append_images=remaining_pages,
                resolution=PDF_PAGE_RESOLUTION,
            )

            if not output_path.exists() or not output_path.read_bytes().startswith(b"%PDF"):
                raise RuntimeError("Image to PDF conversion did not create a valid PDF")

            s3.upload_file(
                str(output_path),
                STORAGE_BUCKET,
                output_key,
                ExtraArgs={
                    "ContentType": "application/pdf",
                },
            )

            print(
                f"Uploaded image PDF: {output_key}",
                flush=True,
            )

        finally:
            for page in pages:
                page.close()

    return output_key


def convert_image(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
) -> str:
    output_format_aliases = {
        "jpg": "JPEG",
        "jpeg": "JPEG",
        "png": "PNG",
        "webp": "WEBP",
    }

    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }

    output_extensions = {
        "jpg": "jpg",
        "jpeg": "jpg",
        "png": "png",
        "webp": "webp",
    }

    if source_format not in IMAGE_INPUT_FORMATS:
        raise ValueError(f"Unsupported image source format: {source_format}")

    if target_format not in IMAGE_TARGET_FORMATS:
        raise ValueError(f"Unsupported image target format: {target_format}")

    output_extension = output_extensions[target_format]
    output_key = f"conversions/{conversion_id}/output.{output_extension}"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / f"input.{source_format}"
        output_path = temp_path / f"output.{output_extension}"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        print(
            f"Converting image {source_format} -> {target_format}",
            flush=True,
        )

        try:
            with Image.open(input_path) as opened_image:
                detected_format = normalize_decoded_image_format(
                    opened_image.format
                )

                if detected_format not in IMAGE_INPUT_FORMATS:
                    raise ValueError(
                        "Unsupported decoded image format: "
                        f"{opened_image.format or 'unknown'}"
                    )

                opened_image.load()
                image = ImageOps.exif_transpose(opened_image)

        except (
            EOFError,
            OSError,
            RuntimeError,
            SyntaxError,
            UnidentifiedImageError,
            ValueError,
        ) as exc:
            raise ValueError(
                f"Invalid or unsupported {source_format.upper()} image data"
            ) from exc

        print(
            "Decoded image content as "
            f"{detected_format.upper()} (declared source: {source_format})",
            flush=True,
        )

        try:
            save_metadata = image_save_metadata(image, target_format)

            if target_format in {"jpg", "jpeg"}:
                if image_has_alpha(image):
                    rgba_image = image.convert("RGBA")
                    background = Image.new("RGB", image.size, "white")
                    background.paste(rgba_image, mask=rgba_image.getchannel("A"))
                    rgba_image.close()
                    image.close()
                    image = background

                elif image.mode != "RGB":
                    converted_image = image.convert("RGB")
                    image.close()
                    image = converted_image

            elif target_format == "webp" and image.mode not in {"RGB", "RGBA"}:
                converted_image = image.convert(
                    "RGBA" if image_has_alpha(image) else "RGB"
                )
                image.close()
                image = converted_image

            image.save(
                output_path,
                format=output_format_aliases[target_format],
                **save_metadata,
            )

        finally:
            image.close()

        if not output_path.exists():
            raise RuntimeError(
                f"Image conversion reported success but {output_path} was not created"
            )

        try:
            with Image.open(output_path) as output_image:
                output_image.verify()
        except (OSError, SyntaxError, UnidentifiedImageError) as exc:
            raise RuntimeError("Converted image output is invalid") from exc

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": content_types[target_format],
            },
        )

        print(
            f"Uploaded converted image: {output_key}",
            flush=True,
        )

    return output_key


def convert_audio(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
) -> str:
    audio_formats = {"mp3", "wav"}

    if source_format not in audio_formats:
        raise ValueError(f"Unsupported audio source format: {source_format}")

    if target_format not in audio_formats:
        raise ValueError(f"Unsupported audio target format: {target_format}")

    if source_format == target_format:
        raise ValueError(
            f"Audio source and target formats are identical: {source_format}"
        )

    content_types = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
    }

    output_key = f"conversions/{conversion_id}/output.{target_format}"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / f"input.{source_format}"
        output_path = temp_path / f"output.{target_format}"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        if target_format == "wav":
            command = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vn",
                "-c:a",
                "pcm_s16le",
                str(output_path),
            ]

        else:
            command = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vn",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "2",
                str(output_path),
            ]

        print(
            f"Running FFmpeg conversion "
            f"{source_format} -> {target_format} "
            f"for {conversion_id}...",
            flush=True,
        )

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=600,
            check=False,
        )

        if result.stdout:
            print(
                f"FFmpeg stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"FFmpeg stderr: {result.stderr.strip()}",
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"FFmpeg reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": content_types[target_format],
            },
        )

        print(
            f"Uploaded converted audio: {output_key}",
            flush=True,
        )

    return output_key


def convert_video(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
) -> str:
    video_formats = {"mp4", "webm"}

    if source_format not in video_formats:
        raise ValueError(f"Unsupported video source format: {source_format}")

    if target_format not in video_formats:
        raise ValueError(f"Unsupported video target format: {target_format}")

    if source_format == target_format:
        raise ValueError(
            f"Video source and target formats are identical: {source_format}"
        )

    content_types = {
        "mp4": "video/mp4",
        "webm": "video/webm",
    }

    output_key = f"conversions/{conversion_id}/output.{target_format}"

    with tempfile.TemporaryDirectory(prefix="convertix-") as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / f"input.{source_format}"
        output_path = temp_path / f"output.{target_format}"

        print(
            f"Downloading s3://{STORAGE_BUCKET}/{input_key}",
            flush=True,
        )

        s3.download_file(
            STORAGE_BUCKET,
            input_key,
            str(input_path),
        )

        if target_format == "webm":
            command = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-c:v",
                "libvpx-vp9",
                "-c:a",
                "libopus",
                str(output_path),
            ]

        else:
            command = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-movflags",
                "+faststart",
                str(output_path),
            ]

        print(
            f"Running FFmpeg video conversion "
            f"{source_format} -> {target_format} "
            f"for {conversion_id}...",
            flush=True,
        )

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=1800,
            check=False,
        )

        if result.stdout:
            print(
                f"FFmpeg stdout: {result.stdout.strip()}",
                flush=True,
            )

        if result.stderr:
            print(
                f"FFmpeg stderr: {result.stderr.strip()}",
                flush=True,
            )

        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg exited with code {result.returncode}")

        if not output_path.exists():
            raise RuntimeError(
                f"FFmpeg reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            STORAGE_BUCKET,
            output_key,
            ExtraArgs={
                "ContentType": content_types[target_format],
            },
        )

        print(
            f"Uploaded converted video: {output_key}",
            flush=True,
        )

    return output_key


def process_conversion(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str | None,
    compression_level: str | None = None,
    input_keys: list[str] | None = None,
) -> str:
    source_format = source_format.lower()
    target_format = target_format.lower()

    if source_format == "pdf" and target_format == "pdf" and compression_level:
        return compress_pdf(
            s3=s3,
            conversion_id=conversion_id,
            input_key=input_key,
            compression_level=compression_level,
        )

    if source_format == "docx" and target_format == "pdf":
        return convert_docx_to_pdf(
            s3=s3,
            conversion_id=conversion_id,
            input_key=input_key,
        )

    if source_format == "xlsx" and target_format == "pdf":
        return convert_xlsx_to_pdf(
            s3=s3,
            conversion_id=conversion_id,
            input_key=input_key,
        )

    if source_format == "txt" and target_format in {"pdf", "docx"}:
        return convert_txt_document(
            s3=s3,
            conversion_id=conversion_id,
            target_format=target_format,
            input_key=input_key,
        )

    if source_format in IMAGE_INPUT_FORMATS and target_format == "pdf":
        image_input_keys = input_keys or ([input_key] if input_key else [])

        if not image_input_keys:
            raise ValueError("Image to PDF conversion requires at least one input")

        if len(image_input_keys) > 20:
            raise ValueError("Image to PDF conversion supports up to 20 inputs")

        return convert_images_to_pdf(
            s3=s3,
            conversion_id=conversion_id,
            inputs=[(source_format, key) for key in image_input_keys],
        )

    if (
        source_format in IMAGE_INPUT_FORMATS
        and target_format in IMAGE_TARGET_FORMATS
        and source_format != target_format
    ):
        return convert_image(
            s3=s3,
            conversion_id=conversion_id,
            source_format=source_format,
            target_format=target_format,
            input_key=input_key,
        )

    audio_formats = {"mp3", "wav"}

    if (
        source_format in audio_formats
        and target_format in audio_formats
        and source_format != target_format
    ):
        return convert_audio(
            s3=s3,
            conversion_id=conversion_id,
            source_format=source_format,
            target_format=target_format,
            input_key=input_key,
        )

    video_formats = {"mp4", "webm"}

    if (
        source_format in video_formats
        and target_format in video_formats
        and source_format != target_format
    ):
        return convert_video(
            s3=s3,
            conversion_id=conversion_id,
            source_format=source_format,
            target_format=target_format,
            input_key=input_key,
        )
    raise ValueError(f"Unsupported conversion: {source_format} -> {target_format}")


def main() -> int:
    if not QUEUE_URL:
        print(
            "QUEUE_URL environment variable is required.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    if not STORAGE_BUCKET:
        print(
            "STORAGE_BUCKET environment variable is required.",
            file=sys.stderr,
            flush=True,
        )
        return 1

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    sqs = boto3.client(
        "sqs",
        region_name=AWS_REGION,
    )

    s3 = boto3.client(
        "s3",
        region_name=AWS_REGION,
    )

    print(
        f"Convertix worker started. Long-polling {QUEUE_URL}",
        flush=True,
    )

    print(
        f"Using storage bucket {STORAGE_BUCKET}",
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
        conversion_id = None

        try:
            body = json.loads(message["Body"])

            conversion_id = body.get("conversion_id")
            compression_level = body.get("compression_level")
            source_format = body.get("source_format")
            target_format = body.get("target_format")
            input_key = body.get("input_key")
            input_keys = body.get("input_keys")

            required_fields = {
                "conversion_id": conversion_id,
                "source_format": source_format,
                "target_format": target_format,
            }

            missing = [name for name, value in required_fields.items() if not value]

            if not input_key and not input_keys:
                missing.append("input_key or input_keys")

            if missing:
                raise ValueError(f"Missing required job fields: {', '.join(missing)}")

            print(
                (
                    f"Received conversion job "
                    f"{conversion_id}: "
                    f"{source_format} -> {target_format} "
                    f"(SQS message {message_id})"
                ),
                flush=True,
            )

            output_key = process_conversion(
                s3=s3,
                conversion_id=conversion_id,
                source_format=source_format,
                target_format=target_format,
                input_key=input_key,
                compression_level=compression_level,
                input_keys=input_keys,
            )

            clear_conversion_failure(s3, conversion_id)

            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )

            print(
                (
                    f"Conversion completed successfully: "
                    f"{conversion_id} "
                    f"-> {output_key} "
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

        except (
            BotoCoreError,
            ClientError,
            subprocess.SubprocessError,
            ValueError,
            RuntimeError,
        ) as exc:
            if conversion_id:
                record_conversion_failure(s3, conversion_id, exc)

            print(
                (
                    f"Conversion failed for SQS message "
                    f"{message_id}: {exc}. "
                    "Leaving message in queue for retry."
                ),
                file=sys.stderr,
                flush=True,
            )

        except Exception as exc:  # noqa: BLE001
            if conversion_id:
                record_conversion_failure(s3, conversion_id, exc)

            print(
                (
                    f"Unexpected error while processing SQS message "
                    f"{message_id}: {exc}. "
                    "Leaving message in queue for retry."
                ),
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
