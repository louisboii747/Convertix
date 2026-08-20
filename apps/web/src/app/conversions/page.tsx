import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import {
  FORMATS,
  getEnabledConversionPairs,
  type ConversionPair,
} from "@/lib/formats";

export const metadata: Metadata = {
  title: "Online File Converters – Convertix",
  description:
    "Browse every live Convertix conversion route for documents, spreadsheets, images, audio, and video.",
  alternates: {
    canonical: "/conversions",
  },
  openGraph: {
    type: "website",
    url: "/conversions",
    title: "Online File Converters – Convertix",
    description:
      "Browse every live Convertix conversion route for documents, spreadsheets, images, audio, and video.",
    siteName: "Convertix",
  },
};

function pairLabel(pair: ConversionPair) {
  return `${FORMATS[pair.source].label} to ${FORMATS[pair.target].label}`;
}

export default function ConversionsPage() {
  const pairs = getEnabledConversionPairs();
  const groupedPairs = Object.entries(
    pairs.reduce<Record<string, ConversionPair[]>>((groups, pair) => {
      const family = FORMATS[pair.source].family;
      groups[family] ??= [];
      groups[family].push(pair);
      return groups;
    }, {}),
  );

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Convertix file conversion routes",
    itemListElement: pairs.map((pair, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: pairLabel(pair),
      url: `https://convertix.uk/${pair.slug}`,
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
              Browse Convertix&apos;s currently supported file conversions. Each
              route has its own focused converter, format guidance, FAQs, and
              related tools.
            </p>
          </div>
        </section>

        {groupedPairs.map(([family, familyPairs]) => (
          <section
            className="popular-section"
            aria-labelledby={`${family}-conversions-title`}
            key={family}
          >
            <div className="section-heading-row">
              <div>
                <span className="section-kicker">{family}</span>
                <h2 id={`${family}-conversions-title`}>
                  {family.charAt(0).toUpperCase() + family.slice(1)} conversions
                </h2>
                <p>Jump straight into a conversion route that is live now.</p>
              </div>
            </div>
            <div className="popular-links">
              {familyPairs.map((pair) => (
                <Link key={pair.slug} href={`/${pair.slug}`}>
                  <span>{pairLabel(pair)}</span>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>
        ))}
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
