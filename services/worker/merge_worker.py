import subprocess
import tempfile
from pathlib import Path

import svg_worker  # noqa: F401
import worker

MAX_MERGE_FILES = 20

_original_process_conversion = worker.process_conversion


def merge_pdf(
    s3,
    conversion_id: str,
    input_key: str,
) -> str:
    input_keys = [item for item in input_key.split("|") if item]

    if len(input_keys) < 2:
        raise ValueError("PDF merge requires at least two inputs")

    if len(input_keys) > MAX_MERGE_FILES:
        raise ValueError(f"PDF merge supports at most {MAX_MERGE_FILES} inputs")

    output_key = f"conversions/{conversion_id}/output.pdf"

    with tempfile.TemporaryDirectory(prefix="convertix-merge-") as temp_dir:
        temp_path = Path(temp_dir)
        input_paths: list[Path] = []

        for index, source_key in enumerate(input_keys, start=1):
            if not source_key.startswith("uploads/") or not source_key.lower().endswith(".pdf"):
                raise ValueError("Invalid PDF merge input key")

            input_path = temp_path / f"input-{index:02d}.pdf"
            print(
                f"Downloading merge input {index}/{len(input_keys)}: "
                f"s3://{worker.STORAGE_BUCKET}/{source_key}",
                flush=True,
            )
            s3.download_file(worker.STORAGE_BUCKET, source_key, str(input_path))
            input_paths.append(input_path)

        output_path = temp_path / "merged.pdf"

        command = [
            "gs",
            "-q",
            "-dBATCH",
            "-dNOPAUSE",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.7",
            f"-sOutputFile={output_path}",
            *[str(path) for path in input_paths],
        ]

        print(
            f"Merging {len(input_paths)} PDFs for {conversion_id}...",
            flush=True,
        )

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=600,
            check=False,
        )

        if result.stdout:
            print(f"Ghostscript stdout: {result.stdout.strip()}", flush=True)

        if result.stderr:
            print(f"Ghostscript stderr: {result.stderr.strip()}", flush=True)

        if result.returncode != 0:
            raise RuntimeError(f"Ghostscript exited with code {result.returncode}")

        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError("Ghostscript reported success but merged.pdf was not created")

        s3.upload_file(
            str(output_path),
            worker.STORAGE_BUCKET,
            output_key,
            ExtraArgs={"ContentType": "application/pdf"},
        )

        print(f"Uploaded merged PDF: {output_key}", flush=True)

    return output_key


def process_conversion(
    s3,
    conversion_id: str,
    source_format: str,
    target_format: str,
    input_key: str,
    compression_level: str | None = None,
) -> str:
    if (
        source_format.lower() == "pdf"
        and target_format.lower() == "pdf"
        and compression_level == "merge"
    ):
        return merge_pdf(
            s3=s3,
            conversion_id=conversion_id,
            input_key=input_key,
        )

    return _original_process_conversion(
        s3=s3,
        conversion_id=conversion_id,
        source_format=source_format,
        target_format=target_format,
        input_key=input_key,
        compression_level=compression_level,
    )


worker.process_conversion = process_conversion


if __name__ == "__main__":
    raise SystemExit(worker.main())
