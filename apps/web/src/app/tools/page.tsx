import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import styles from "./tools.module.css";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Use Convertix to merge PDFs, compress PDFs, and optimize SVG files.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    type: "website",
    url: "/tools",
    title: "Convertix Tools",
    description:
      "Merge PDFs, compress PDFs, and optimize SVG files with Convertix.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertix Tools",
    description:
      "Merge PDFs, compress PDFs, and optimize SVG files with Convertix.",
  },
};

const tools = [
  {
    href: "/merge-pdf",
    title: "Merge PDF",
    description:
      "Combine multiple PDFs into one file, drag them into the right order, and download the merged result.",
    meta: ["Drag to reorder", "Up to 20 PDFs", "Free"],
  },
  {
    href: "/compress-pdf",
    title: "Compress PDF",
    description:
      "Choose how much to shrink a PDF, compare the original and compressed sizes, and download the smaller file.",
    meta: ["3 compression levels", "Size comparison", "Free"],
  },
  {
    href: "/optimize-svg",
    title: "Optimize SVG",
    description:
      "Reduce an SVG in your browser, compare both renders, and download it only if the artwork still matches.",
    meta: ["Runs in your browser", "Compares both renders", "Free"],
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <section className={styles.hero}>
          <h1>Small tools for annoying file problems.</h1>
          <p>
            Merge PDFs, shrink large files, or clean up an SVG without opening
            a full editor.
          </p>
        </section>

        <section className={styles.grid} aria-label="Available tools">
          {tools.map((tool) => (
            <Link key={tool.href} className={styles.card} href={tool.href}>
              <div className={styles.cardTop}>
                <span className={styles.arrow} aria-hidden="true">
                  <ArrowIcon />
                </span>
              </div>

              <div>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
              </div>

              <div className={styles.meta} aria-label="Tool features">
                {tool.meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </Link>
          ))}

          <Link className={styles.suggestion} href="/contact">
            <span className={styles.arrow} aria-hidden="true"><ArrowIcon /></span>
            <h2>Missing a tool?</h2>
            <p>
              Tell us which file job is slowing you down. A specific example
              helps us decide what to build next.
            </p>
          </Link>
        </section>
      </main>
    </>
  );
}
