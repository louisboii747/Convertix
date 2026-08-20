import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import styles from "../tools/tools.module.css";

export const metadata: Metadata = {
  title: "PDF Tools – Compress & Convert PDFs",
  description: "Use Convertix PDF tools to compress PDF files or create PDFs from DOCX, XLSX, and TXT files.",
  alternates: { canonical: "/pdf-tools" },
  openGraph: { type: "website", url: "/pdf-tools", title: "Convertix PDF Tools", description: "Compress PDFs and use live Convertix routes that create PDF files." },
};

const pdfTools = [
  { href: "/compress-pdf", eyebrow: "Optimize", title: "Compress PDF", description: "Reduce a PDF's file size with light, balanced, or maximum compression.", meta: ["3 levels", "Size comparison", "PDF"] },
  { href: "/docx-to-pdf", eyebrow: "Documents", title: "DOCX to PDF", description: "Turn a Word document into a fixed-layout PDF for sharing, printing, or submission.", meta: ["Word", "PDF", "Live"] },
  { href: "/xlsx-to-pdf", eyebrow: "Spreadsheets", title: "XLSX to PDF", description: "Create a shareable PDF snapshot from an Excel workbook.", meta: ["Excel", "PDF", "Live"] },
  { href: "/txt-to-pdf", eyebrow: "Documents", title: "TXT to PDF", description: "Put plain text into a fixed PDF document that's easier to print and share.", meta: ["Text", "PDF", "Live"] },
] as const;

export default function PdfToolsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Convertix PDF Tools",
    url: "https://convertix.uk/pdf-tools",
    hasPart: pdfTools.map((tool) => ({ "@type": "WebPage", name: tool.title, url: `https://convertix.uk${tool.href}` })),
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>PDF Toolkit</span>
          <h1>Get your PDF into shape.</h1>
          <p>Compress an existing PDF or turn a supported document or spreadsheet into one. This toolkit will grow as new PDF jobs become available.</p>
        </section>
        <section className={styles.grid} aria-label="PDF tools">
          {pdfTools.map((tool) => (
            <Link key={tool.href} className={styles.card} href={tool.href}>
              <div className={styles.cardTop}><span className={styles.cardEyebrow}>{tool.eyebrow}</span><span className={styles.arrow} aria-hidden="true">→</span></div>
              <div><h2>{tool.title}</h2><p>{tool.description}</p></div>
              <div className={styles.meta}>{tool.meta.map((item) => <span key={item}>{item}</span>)}</div>
            </Link>
          ))}
          <div className={styles.comingSoon}>
            <span className={styles.cardEyebrow}>Growing toolkit</span>
            <h2>More PDF jobs belong here.</h2>
            <p>Merge, split, rotate, image-to-PDF and PDF-to-image tools can slot into this same focused toolkit as they become genuinely supported.</p>
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
