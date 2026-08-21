import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { FormatMark } from "@/components/format-mark";
import { SiteHeader } from "@/components/site-header";
import { FORMATS, getEnabledConversionPairs, type FormatId } from "@/lib/formats";

export const metadata: Metadata = {
  title: "File Formats and Conversion Guides",
  description: "Explore file formats supported by Convertix, learn what each format is for, and jump into live conversion routes.",
  alternates: { canonical: "/formats" },
  openGraph: {
    type: "website",
    url: "/formats",
    title: "File Formats and Conversion Guides",
    description: "Explore file formats supported by Convertix and find live conversion routes for documents, images, audio and video.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "File Formats and Conversion Guides — Convertix",
    description: "Explore file formats supported by Convertix and find the live conversion routes that use them.",
  },
};

function getLiveFormats(): FormatId[] {
  return Array.from(
    new Set(getEnabledConversionPairs().flatMap((pair) => [pair.source, pair.target])),
  );
}

export default function FormatsPage() {
  const formats = getLiveFormats();

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="formats-page-title">
          <div className="hero-copy hero-copy-benefit">
            <span className="hero-eyebrow">Format library</span>
            <h1 id="formats-page-title">Understand the format before you convert it.</h1>
            <p>
              Browse the file formats connected to live Convertix routes, see what each one is best at,
              and jump directly into the tools that use it.
            </p>
          </div>
        </section>

        <section className="formats-section format-cloud-section" aria-labelledby="live-formats-title">
          <div className="formats-heading">
            <span className="section-kicker">Live format hubs</span>
            <h2 id="live-formats-title">Formats connected to working conversion routes.</h2>
            <p>Each hub explains the format and links every live route that can create or consume it.</p>
          </div>
          <div className="format-cloud">
            {formats.map((formatId) => (
              <Link className="format-cloud-item" href={`/formats/${formatId}`} key={formatId}>
                <FormatMark format={formatId} />
                <span>{FORMATS[formatId].label}</span>
                <small>{FORMATS[formatId].name}</small>
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
