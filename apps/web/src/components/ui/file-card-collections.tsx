import type { ReactNode } from "react";

import styles from "./file-card-collections.module.css";

export type FormatFileProps =
  | "doc"
  | "pdf"
  | "md"
  | "mdx"
  | "csv"
  | "xls"
  | "xlsx"
  | "txt"
  | "ppt"
  | "pptx"
  | "zip"
  | "rar"
  | "tar"
  | "gz"
  | "code"
  | "html"
  | "js"
  | "jsx"
  | "tsx"
  | "css"
  | "json"
  | "img"
  | "png"
  | "jpg"
  | "jpeg"
  | "video";

interface FileCardProps {
  formatFile: FormatFileProps;
  label?: string;
}

function Bar({ width, strong = false }: { width: string; strong?: boolean }) {
  return (
    <i
      className={`${styles.bar} ${strong ? styles.barStrong : ""}`}
      style={{ width }}
    />
  );
}

function DefaultPlaceholder() {
  return (
    <div className={styles.stack}>
      <div className={styles.lineGroup}>
        <Bar width="50%" strong />
      </div>
      <div className={styles.lineGroup}>
        <Bar width="34%" />
        <Bar width="34%" />
      </div>
      <div className={styles.lineGroup}>
        <Bar width="50%" />
        <Bar width="30%" />
      </div>
      <div className={styles.lineGroup}>
        <Bar width="32%" />
        <Bar width="34%" />
      </div>
      <div className={styles.lineGroup}>
        <Bar width="35%" />
        <Bar width="48%" />
      </div>
      <div className={styles.lineGroup}>
        <Bar width="32%" />
      </div>
    </div>
  );
}

function MarkdownPlaceholder() {
  return (
    <div className={styles.stack}>
      <div className={styles.markdownHeading}>
        <span>#</span>
        <Bar width="24px" strong />
      </div>
      <div className={styles.markdownBody}>
        <Bar width="34%" />
        <Bar width="28px" />
        <Bar width="32px" />
        <Bar width="16px" />
        <Bar width="34%" />
      </div>
    </div>
  );
}

function SheetPlaceholder() {
  return (
    <div className={styles.sheet}>
      {Array.from({ length: 12 }, (_, index) => (
        <i
          className={`${styles.cell} ${index < 3 ? styles.cellHeader : ""}`}
          key={index}
        />
      ))}
    </div>
  );
}

function ArchivePlaceholder() {
  return (
    <div className={styles.archive}>
      <div className={styles.zipper}>
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}

function MediaPlaceholder({ kind }: { kind: "image" | "video" | "slide" }) {
  return (
    <div className={styles.preview}>
      {kind === "video" ? (
        <i className={styles.play} />
      ) : (
        <i
          className={`${styles.previewArt} ${kind === "slide" ? styles.slideArt : ""}`}
        />
      )}
      <Bar width="16px" strong />
      <Bar width="30px" />
    </div>
  );
}

function CodePlaceholder() {
  return (
    <div className={styles.code}>
      <div className={styles.codeLine}>
        <span>&lt;</span>
        <i className={styles.syntaxGreen} />
        <span>&gt;</span>
      </div>
      <div className={styles.codeLine}>
        <span>&lt;</span>
        <i className={styles.syntaxBlue} />
        <span>&gt;</span>
      </div>
      <div className={styles.codeLine}>
        <span>&lt;/</span>
        <i className={styles.syntaxBlue} />
        <span>&gt;</span>
      </div>
      <div className={styles.codeLine}>
        <span>&lt;</span>
        <i className={styles.syntaxGreen} />
        <span>/&gt;</span>
      </div>
    </div>
  );
}

function StructuredPlaceholder({ css = false }: { css?: boolean }) {
  return (
    <div className={styles.structured}>
      <div className={styles.brace}>{"{"}</div>
      {["28px", "22px", "31px"].map((width) => (
        <div className={styles.structuredRow} key={width}>
          {css ? (
            <i className={styles.syntaxBlue} />
          ) : (
            <Bar width={width} strong />
          )}
          <Bar width="13px" />
        </div>
      ))}
      <div className={styles.brace}>{"}"}</div>
    </div>
  );
}

function getPlaceholder(formatFile: FormatFileProps): ReactNode {
  if (formatFile === "md" || formatFile === "mdx") {
    return <MarkdownPlaceholder />;
  }

  if (formatFile === "xls" || formatFile === "xlsx" || formatFile === "csv") {
    return <SheetPlaceholder />;
  }

  if (["zip", "rar", "tar", "gz"].includes(formatFile)) {
    return <ArchivePlaceholder />;
  }

  if (formatFile === "ppt" || formatFile === "pptx") {
    return <MediaPlaceholder kind="slide" />;
  }

  if (["img", "png", "jpg", "jpeg"].includes(formatFile)) {
    return <MediaPlaceholder kind="image" />;
  }

  if (formatFile === "video") {
    return <MediaPlaceholder kind="video" />;
  }

  if (["html", "js", "jsx", "tsx", "code"].includes(formatFile)) {
    return <CodePlaceholder />;
  }

  if (formatFile === "css") {
    return <StructuredPlaceholder css />;
  }

  if (formatFile === "json") {
    return <StructuredPlaceholder />;
  }

  return <DefaultPlaceholder />;
}

export function FileCard({ formatFile, label }: FileCardProps) {
  return (
    <div aria-hidden="true" className={styles.card}>
      <div className={styles.badge} data-format={formatFile}>
        {label ?? formatFile}
      </div>
      <div className={styles.document}>{getPlaceholder(formatFile)}</div>
    </div>
  );
}

export default FileCard;
