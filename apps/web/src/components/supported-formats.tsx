import Link from "next/link";

import {
  FileCard,
  type FormatFileProps,
} from "@/components/ui/file-card-collections";
import { FORMATS, type FormatId } from "@/lib/formats";

import styles from "./supported-formats.module.css";

const formatCardVariants: Partial<Record<FormatId, FormatFileProps>> = {
  docx: "doc",
  pdf: "pdf",
  txt: "txt",
  xlsx: "xlsx",
  jpg: "jpg",
  png: "png",
  webp: "img",
  heic: "img",
  heif: "img",
  svg: "img",
  mp4: "video",
  webm: "video",
};

export function SupportedFormats({
  formatIds,
}: {
  formatIds: readonly FormatId[];
}) {
  const cards = formatIds.flatMap((formatId) => {
    const variant = formatCardVariants[formatId];

    return variant ? [{ formatId, variant }] : [];
  });

  return (
    <div
      className={styles.grid}
      aria-label="Formats with available conversions"
    >
      {cards.map(({ formatId, variant }) => (
        <Link
          className={styles.link}
          href={`/formats/${formatId}`}
          key={formatId}
          aria-label={`${FORMATS[formatId].label}: view format guide and conversions`}
        >
          <FileCard formatFile={variant} label={FORMATS[formatId].label} />
          <span className={styles.copy}>
            <strong>{FORMATS[formatId].label}</strong>
            <small>{FORMATS[formatId].name}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
