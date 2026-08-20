import type { Metadata } from "next";

import { ConversionDirectory } from "@/components/conversion-directory";
import { SiteHeader } from "@/components/site-header";
import { FORMATS, getEnabledConversionPairs } from "@/lib/formats";

export const metadata: Metadata = {
  title: "Online File Converters – Convertix",
  description:
    "Browse and search every live Convertix conversion route for documents, spreadsheets, images, audio, and video.",
  alternates: {
    canonical: "/conversions",
  },
  openGraph: {
    type: "website",
    url: "/conversions",
    title: "Online File Converters – Convertix",
    description:
      "Browse and search every live Convertix conversion route for documents, spreadsheets, images, audio, and video.",
    siteName: "Convertix",
  },
};

export default function ConversionsPage() {
  const pairs = getEnabledConversionPairs();
  const entries = pairs.map((pair) => ({
    slug: pair.slug,
    label: `${FORMATS[pair.source].label} to ${FORMATS[pair.target].label}`,
    family: FORMATS[pair.source].family,
    source: FORMATS[pair.source].label,
    target: FORMATS[pair.target].label,
    popular: pair.popular,
  }));

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Convertix file conversion routes",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.label,
      url: `https://convertix.uk/${entry.slug}`,
    })),
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="conversions-title">
          <div className="hero-copy hero-copy-benefit">
            <span className="hero-eyebrow">Every live route, in one place.</span>
            <h1 id="conversions-title">Choose the conversion you need.</h1>
            <p>
              Search Convertix&apos;s supported file conversions by format or type,
              then jump straight into the focused converter you need.
            </p>
          </div>
        </section>

        <ConversionDirectory entries={entries} />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListStructuredData),
        }}
      />
    </>
  );
}
