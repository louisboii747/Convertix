import subprocess
import tempfile
from pathlib import Path

from PIL import Image

import worker


def convert_svg(
    s3,
    conversion_id: str,
    target_format: str,
    input_key: str,
) -> str:
    output_formats = {
        "png": ("png", "image/png", "PNG"),
        "jpg": ("jpg", "image/jpeg", "JPEG"),
        "jpeg": ("jpg", "image/jpeg", "JPEG"),
        "webp": ("webp", "image/webp", "WEBP"),
    }

    if target_format not in output_formats:
        raise ValueError(f"Unsupported SVG target format: {target_format}")

    output_extension, content_type, pillow_format = output_formats[target_format]
    output_key = f"conversions/{conversion_id}/output.{output_extension}"

    with tempfile.TemporaryDirectory(prefix="convertix-svg-") as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.svg"
        rendered_png = temp_path / "rendered.png"
        output_path = temp_path / f"output.{output_extension}"

        print(
            f"Downloading s3://{worker.STORAGE_BUCKET}/{input_key}",
            flush=True,
        )
        s3.download_file(worker.STORAGE_BUCKET, input_key, str(input_path))

        print(
            f"Rendering SVG for {conversion_id} with librsvg...",
            flush=True,
        )
        result = subprocess.run(
            [
                "rsvg-convert",
                "--format",
                "png",
                "--output",
                str(rendered_png),
                str(input_path),
            ],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )

        if result.stderr:
            print(f"rsvg-convert stderr: {result.stderr.strip()}", flush=True)

        if result.returncode != 0:
            raise RuntimeError(f"rsvg-convert exited with code {result.returncode}")

        if not rendered_png.exists():
            raise RuntimeError("SVG render reported success but no PNG was created")

        if target_format == "png":
            rendered_png.replace(output_path)
        else:
            with Image.open(rendered_png) as image:
                image.load()

                if target_format in {"jpg", "jpeg"}:
                    if image.mode in {"RGBA", "LA"} or (
                        image.mode == "P" and "transparency" in image.info
                    ):
                        rgba = image.convert("RGBA")
                        background = Image.new("RGB", rgba.size, "white")
                        background.paste(rgba, mask=rgba.getchannel("A"))
                        image = background
                    elif image.mode != "RGB":
                        image = image.convert("RGB")

                image.save(output_path, format=pillow_format)

        if not output_path.exists():
            raise RuntimeError(
                f"SVG conversion reported success but {output_path} was not created"
            )

        s3.upload_file(
            str(output_path),
            worker.STORAGE_BUCKET,
            output_key,
            ExtraArgs={"ContentType": content_type},
        )

        print(f"Uploaded converted SVG: {output_key}", flush=True)

    return output_key


_original_process_conversion = worker.process_conversion


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

    if source_format == "svg" and target_format in {
        "png",
        "jpg",
        "jpeg",
        "webp",
    }:
        if not input_key:
            raise ValueError("SVG conversion requires an input_key")

        return convert_svg(
            s3=s3,
            conversion_id=conversion_id,
            target_format=target_format,
            input_key=input_key,
        )

    return _original_process_conversion(
        s3=s3,
        conversion_id=conversion_id,
        source_format=source_format,
        target_format=target_format,
        input_key=input_key,
        compression_level=compression_level,
        input_keys=input_keys,
    )


worker.process_conversion = process_conversion


if __name__ == "__main__":
    raise SystemExit(worker.main())
