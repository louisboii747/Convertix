import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { FormatMark } from "@/components/format-mark";
import { SiteHeader } from "@/components/site-header";
import { FORMATS, getEnabledConversionPairs, type FormatId } from "@/lib/formats";

export const metadata: Metadata = {
  title: "File Formats and Conversion Guides",
  description: "Learn what common file formats are used for and find the Convertix converters that support them.",
  alternates: { canonical: "/formats" },
  openGraph: {
    type: "website",
    url: "/formats",
    title: "File Formats and Conversion Guides",
    description: "Learn about common file formats and find converters for documents, images, audio and video.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "File Formats and Conversion Guides — Convertix",
    description: "Learn about common file formats and find the Convertix converters that support them.",
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
            <h1 id="formats-page-title">File format guides</h1>
            <p>
              Learn what each format is used for and find the conversions that
              support it.
            </p>
          </div>
        </section>

        <section className="formats-section format-cloud-section" aria-labelledby="live-formats-title">
          <div className="formats-heading">
            <h2 id="live-formats-title">Choose a format</h2>
            <p>See what it is used for and which conversions are available.</p>
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
