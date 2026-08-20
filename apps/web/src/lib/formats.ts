export const FORMATS = {
  pdf: {
    id: "pdf",
    label: "PDF",
    name: "PDF document",
    family: "documents",
    extensions: ["pdf"],
    accent: "red",
  },
  docx: {
    id: "docx",
    label: "DOCX",
    name: "Word document",
    family: "documents",
    extensions: ["docx"],
    accent: "blue",
  },
  doc: {
    id: "doc",
    label: "DOC",
    name: "Legacy Word document",
    family: "documents",
    extensions: ["doc"],
    accent: "blue",
  },
  txt: {
    id: "txt",
    label: "TXT",
    name: "Plain text",
    family: "documents",
    extensions: ["txt"],
    accent: "slate",
  },
  jpg: {
    id: "jpg",
    label: "JPG",
    name: "JPEG image",
    family: "images",
    extensions: ["jpg", "jpeg"],
    accent: "violet",
  },
  png: {
    id: "png",
    label: "PNG",
    name: "PNG image",
    family: "images",
    extensions: ["png"],
    accent: "violet",
  },
  webp: {
    id: "webp",
    label: "WEBP",
    name: "WebP image",
    family: "images",
    extensions: ["webp"],
    accent: "violet",
  },
  svg: {
    id: "svg",
    label: "SVG",
    name: "Scalable Vector Graphic",
    family: "images",
    extensions: ["svg"],
    accent: "violet",
  },
  xlsx: {
    id: "xlsx",
    label: "XLSX",
    name: "Excel workbook",
    family: "spreadsheets",
    extensions: ["xlsx"],
    accent: "green",
  },
  xls: {
    id: "xls",
    label: "XLS",
    name: "Legacy Excel workbook",
    family: "spreadsheets",
    extensions: ["xls"],
    accent: "green",
  },
  csv: {
    id: "csv",
    label: "CSV",
    name: "Comma-separated values",
    family: "spreadsheets",
    extensions: ["csv"],
    accent: "green",
  },
  pptx: {
    id: "pptx",
    label: "PPTX",
    name: "PowerPoint presentation",
    family: "presentations",
    extensions: ["pptx"],
    accent: "orange",
  },
  mp3: {
    id: "mp3",
    label: "MP3",
    name: "MP3 audio",
    family: "audio",
    extensions: ["mp3"],
    accent: "violet",
  },
  mp4: {
    id: "mp4",
    label: "MP4",
    name: "MP4 video",
    family: "video",
    extensions: ["mp4"],
    accent: "violet",
  },
  webm: {
    id: "webm",
    label: "WEBM",
    name: "WebM video",
    family: "video",
    extensions: ["webm"],
    accent: "violet",
  },
  wav: {
    id: "wav",
    label: "WAV",
    name: "WAV audio",
    family: "audio",
    extensions: ["wav"],
    accent: "violet",
  },
} as const;

export type FormatId = keyof typeof FORMATS;
export type FormatFamily =
  "documents" | "images" | "spreadsheets" | "presentations" | "audio" | "video";

export interface ConversionPair {
  slug: string;
  source: FormatId;
  target: FormatId;
  popular: boolean;
}

export const CONVERSION_PAIRS: readonly ConversionPair[] = [
  { slug: "docx-to-pdf", source: "docx", target: "pdf", popular: true },

  { slug: "txt-to-pdf", source: "txt", target: "pdf", popular: true },
  { slug: "txt-to-docx", source: "txt", target: "docx", popular: false },

  { slug: "xlsx-to-pdf", source: "xlsx", target: "pdf", popular: true },

  { slug: "png-to-jpg", source: "png", target: "jpg", popular: true },
  { slug: "png-to-webp", source: "png", target: "webp", popular: true },

  { slug: "jpg-to-png", source: "jpg", target: "png", popular: true },
  { slug: "jpg-to-webp", source: "jpg", target: "webp", popular: false },

  { slug: "webp-to-png", source: "webp", target: "png", popular: false },
  { slug: "webp-to-jpg", source: "webp", target: "jpg", popular: false },

  { slug: "svg-to-png", source: "svg", target: "png", popular: true },
  { slug: "svg-to-jpg", source: "svg", target: "jpg", popular: true },
  { slug: "svg-to-webp", source: "svg", target: "webp", popular: true },

  { slug: "mp3-to-wav", source: "mp3", target: "wav", popular: true },
  { slug: "wav-to-mp3", source: "wav", target: "mp3", popular: true },

  { slug: "mp4-to-webm", source: "mp4", target: "webm", popular: true },

  { slug: "webm-to-mp4", source: "webm", target: "mp4", popular: true },
] as const;

export const FORMAT_FAMILIES: readonly {
  id: FormatFamily;
  label: string;
  formats: readonly FormatId[];
}[] = [
  {
    id: "documents",
    label: "Documents",
    formats: ["pdf", "docx", "doc", "txt"],
  },
  {
    id: "images",
    label: "Images",
    formats: ["jpg", "png", "webp", "svg"],
  },
  {
    id: "audio",
    label: "Audio",
    formats: ["mp3", "wav"],
  },
  {
    id: "spreadsheets",
    label: "Spreadsheets",
    formats: ["xlsx", "xls", "csv"],
  },
  {
    id: "presentations",
    label: "Presentations",
    formats: ["pptx"],
  },
  {
    id: "video",
    label: "Video",
    formats: ["mp4", "webm"],
  },
] as const;

export const ACCEPTED_FILE_EXTENSIONS = Object.values(FORMATS)
  .flatMap((format) => format.extensions)
  .map((extension) => `.${extension}`)
  .join(",");

export function isFormatId(value: string): value is FormatId {
  return value in FORMATS;
}

export function getFormatFromFileName(fileName: string): FormatId | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) {
    return null;
  }

  const match = Object.values(FORMATS).find((format) =>
    format.extensions.some((candidate) => candidate === extension),
  );

  return match?.id ?? null;
}

export function getConversionPair(
  source: FormatId,
  target: FormatId,
): ConversionPair | null {
  return (
    CONVERSION_PAIRS.find(
      (pair) => pair.source === source && pair.target === target,
    ) ?? null
  );
}

export function getConversionPairBySlug(slug: string): ConversionPair | null {
  return CONVERSION_PAIRS.find((pair) => pair.slug === slug) ?? null;
}

export function getKnownTargets(source: FormatId): readonly FormatId[] {
  return CONVERSION_PAIRS.filter((pair) => pair.source === source).map(
    (pair) => pair.target,
  );
}

export function isConversionPairEnabled(pair: ConversionPair): boolean {
  return CONVERSION_PAIRS.some(
    (candidate) =>
      candidate.slug === pair.slug &&
      candidate.source === pair.source &&
      candidate.target === pair.target,
  );
}

export function getEnabledConversionPairs(): readonly ConversionPair[] {
  return CONVERSION_PAIRS;
}
