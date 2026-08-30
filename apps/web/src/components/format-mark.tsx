import type { FormatId } from "@/lib/formats";

const formatGlyphs: Record<FormatId, string> = {
  pdf: "PDF",
  docx: "W",
  doc: "W",
  txt: "TXT",
  jpg: "JPG",
  png: "PNG",
  webp: "WEBP",
  heic: "HEIC",
  heif: "HEIF",
  svg: "SVG",
  xlsx: "X",
  xls: "X",
  csv: "CSV",
  pptx: "P",
  mp3: "MP3",
  mp4: "MP4",
  webm: "WEBM",
  wav: "WAV",
};

export function FormatMark({
  format,
  compact = false,
}: {
  format: FormatId;
  compact?: boolean;
}) {
  return (
    <span
      className={`format-mark ${compact ? "is-compact" : ""}`}
      data-format={format}
      aria-hidden="true"
    >
      <span>{formatGlyphs[format]}</span>
    </span>
  );
}
