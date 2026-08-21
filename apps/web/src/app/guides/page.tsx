import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "File Format Guides & Conversion Help",
  description: "Practical guides to PDF, DOCX, PNG, JPG, WebP, SVG, MP3, WAV, MP4 and WebM. Compare formats and choose the right converter.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: "/guides",
    title: "File Format Guides & Conversion Help — Convertix",
    description: "Practical file format comparisons and conversion guidance from Convertix.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "File Format Guides & Conversion Help — Convertix",
    description: "Practical file format comparisons and conversion guidance from Convertix.",
  },
};

export default function GuidesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="guides-page">
        <header className="guides-hero">
          <h1>File format guides</h1>
          <p>Compare common formats, check compatibility, and see what may change when you convert a file.</p>
        </header>

        <section className="guide-grid" aria-label="File format guides">
          {GUIDES.map((guide) => (
            <Link className="guide-card" href={`/guides/${guide.slug}`} key={guide.slug}>
              <div><h2>{guide.title}</h2><p>{guide.description}</p></div>
              <footer><span>Read guide</span><ArrowIcon /></footer>
            </Link>
          ))}
        </section>

        <section className="guides-promo" aria-labelledby="guide-tools-title">
          <div><h2 id="guide-tools-title">Already know what you need?</h2><p>Open the full list of available converters.</p></div>
          <Link href="/conversions" className="guides-promo-link">Find a converter <ArrowIcon /></Link>
        </section>
      </main>
    </>
  );
}
