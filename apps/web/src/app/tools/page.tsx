import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import styles from "./tools.module.css";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Explore focused Convertix tools for optimizing and working with files, including PDF compression and safe SVG optimization.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    type: "website",
    url: "/tools",
    title: "Convertix Tools",
    description:
      "Focused file utilities from Convertix, including PDF compression and safe SVG optimization.",
  },
};

const tools = [
  {
    href: "/compress-pdf",
    eyebrow: "PDF Toolkit",
    title: "Compress PDF",
    description:
      "Reduce PDF file size with adjustable compression levels, compare the original and compressed size, and download the optimized result.",
    meta: ["3 compression levels", "Size comparison", "Free"],
  },
  {
    href: "/optimize-svg",
    eyebrow: "SVG Toolkit",
    title: "Safe SVG Optimizer",
    description:
      "Reduce SVG file size locally in your browser, compare before and after renders, and block the download if optimization changes the artwork.",
    meta: ["No upload", "Visual verification", "Free"],
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Convertix Tools</span>
          <h1>Small tools for annoying file problems.</h1>
          <p>
            Focused utilities built around real file-handling problems. More
            tools will appear here as Convertix grows.
          </p>
        </section>

        <section className={styles.grid} aria-label="Available tools">
          {tools.map((tool) => (
            <Link key={tool.href} className={styles.card} href={tool.href}>
              <div className={styles.cardTop}>
                <span className={styles.cardEyebrow}>{tool.eyebrow}</span>
                <span className={styles.arrow} aria-hidden="true">
                  →
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

          <div className={styles.comingSoon}>
            <span className={styles.cardEyebrow}>More coming</span>
            <h2>Built from real complaints.</h2>
            <p>
              Future tools will focus on recurring problems such as file
              optimization, health checks, and batch workflows.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
