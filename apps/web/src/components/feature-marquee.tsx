import styles from "./feature-marquee.module.css";

const FEATURES = [
  "DOCX → PDF",
  "XLSX → PDF",
  "Image conversions",
  "Audio conversions",
  "Video conversions",
  "PDF toolkit",
  "SVG optimization",
  "Conversion guides",
  "Mobile friendly",
  "Free tools",
] as const;

export function FeatureMarquee() {
  return (
    <section className={styles.marquee} aria-label="Convertix features">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <div className={styles.group} aria-hidden={copy === 1} key={copy}>
            {FEATURES.map((feature) => (
              <span className={styles.item} key={`${copy}-${feature}`}>
                <span className={styles.dot} aria-hidden="true" />
                {feature}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
