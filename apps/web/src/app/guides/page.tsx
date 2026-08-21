import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "File Format Guides & Conversion Help",
  description: "Practical guides to PDF, DOCX, PNG, JPG, WebP, SVG, MP3, WAV, MP4 and WebM. Compare formats and choose the right conversion route.",
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
          <span className="section-kicker">Convertix Guides</span>
          <h1>Understand the format before you convert it.</h1>
          <p>Practical, original explanations of file formats, compatibility and conversion trade-offs. Pick the right format, understand what may change, then jump straight into the relevant Convertix tool.</p>
        </header>

        <section className="guide-grid" aria-label="File format guides">
          {GUIDES.map((guide) => (
            <Link className="guide-card" href={`/guides/${guide.slug}`} key={guide.slug}>
              <div><span className="section-kicker">{guide.eyebrow}</span><h2>{guide.title}</h2><p>{guide.description}</p></div>
              <footer><span>Read guide</span><ArrowIcon /></footer>
            </Link>
          ))}
        </section>

        <section className="guides-promo" aria-labelledby="guide-tools-title">
          <div><span className="section-kicker">Need the tool instead?</span><h2 id="guide-tools-title">Browse every live conversion route.</h2><p>If you already know the format you need, skip the reading and go straight to the converter.</p></div>
          <Link href="/conversions" className="guides-promo-link">Browse conversions <ArrowIcon /></Link>
        </section>
      </main>
    </>
  );
}
