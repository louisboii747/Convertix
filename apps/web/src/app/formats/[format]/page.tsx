import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon, RouteIcon } from "@/components/icons";
import { FormatMark } from "@/components/format-mark";
import { SiteHeader } from "@/components/site-header";
import { getFormatContent } from "@/lib/format-content";
import {
  FORMATS,
  getEnabledConversionPairs,
  isFormatId,
  type FormatId,
} from "@/lib/formats";
import { GUIDES } from "@/lib/guides";

interface FormatPageProps {
  params: Promise<{ format: string }>;
}

function getLiveFormats(): FormatId[] {
  return Array.from(
    new Set(getEnabledConversionPairs().flatMap((pair) => [pair.source, pair.target])),
  );
}

export function generateStaticParams() {
  return getLiveFormats().map((format) => ({ format }));
}

export async function generateMetadata({ params }: FormatPageProps): Promise<Metadata> {
  const { format } = await params;
  if (!isFormatId(format) || !getLiveFormats().includes(format)) return {};

  const info = FORMATS[format];
  const content = getFormatContent(format);
  const title = `${info.label} File Format: Converters, Uses and Guide`;
  const description = content?.summary ?? `Learn about ${info.label} files and see the Convertix conversions available for them.`;
  const canonical = `/formats/${format}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Convertix",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function FormatPage({ params }: FormatPageProps) {
  const { format } = await params;
  if (!isFormatId(format) || !getLiveFormats().includes(format)) notFound();

  const info = FORMATS[format];
  const content = getFormatContent(format);
  if (!content) notFound();

  const routes = getEnabledConversionPairs().filter(
    (pair) => pair.source === format || pair.target === format,
  );
  const guides = GUIDES.filter((guide) =>
    `${guide.title} ${guide.intro} ${guide.routes.map((route) => route.label).join(" ")}`
      .toLowerCase()
      .includes(info.label.toLowerCase()),
  ).slice(0, 4);

  const faqItems = [
    {
      question: `What is a ${info.label} file?`,
      answer: content.summary,
    },
    {
      question: `Can Convertix convert ${info.label} files?`,
      answer: `Yes. The conversions listed on this page are the ${info.label} options currently available in Convertix.`,
    },
    {
      question: `Will converting a ${info.label} file preserve everything?`,
      answer: "Not necessarily. File formats support different features, so conversion can change layout, compression, transparency, metadata, codecs or editability. Check important outputs before replacing the original.",
    },
  ];

  const canonicalUrl = `https://convertix.uk/formats/${format}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: `${info.label} file format guide`,
        description: content.summary,
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://convertix.uk/#website",
          name: "Convertix",
          url: "https://convertix.uk",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Convertix", item: "https://convertix.uk" },
          { "@type": "ListItem", position: 2, name: "Formats", item: "https://convertix.uk/formats" },
          { "@type": "ListItem", position: 3, name: info.label, item: canonicalUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="format-page-title">
          <div className="hero-copy hero-copy-benefit">
            <div aria-hidden="true"><FormatMark format={format} /></div>
            <h1 id="format-page-title">About {info.label} files</h1>
            <p>{content.description}</p>
          </div>
        </section>

        <section className="why-section" aria-labelledby="format-overview-title">
          <div className="why-heading">
            <h2 id="format-overview-title">Where {info.label} works well</h2>
            <p>{content.summary}</p>
          </div>
          <div className="why-points">
            <article>
              <RouteIcon />
              <h3>Common uses</h3>
              <p>{content.useCases.join(" · ")}</p>
            </article>
            <article>
              <RouteIcon />
              <h3>Strengths</h3>
              <p>{content.strengths.join(" · ")}</p>
            </article>
            <article>
              <RouteIcon />
              <h3>Things to know</h3>
              <p>{content.considerations.join(" · ")}</p>
            </article>
          </div>
        </section>

        <section className="popular-section" aria-labelledby="format-routes-title">
          <div className="section-heading-row">
            <div>
              <h2 id="format-routes-title">{info.label} conversions</h2>
              <p>Choose an option to open its converter.</p>
            </div>
          </div>
          <div className="popular-links">
            {routes.map((pair) => (
              <Link href={`/${pair.slug}`} key={pair.slug}>
                <span>{FORMATS[pair.source].label} to {FORMATS[pair.target].label}</span>
                <ArrowIcon />
              </Link>
            ))}
          </div>
        </section>

        {guides.length > 0 ? (
          <section className="guides-promo" aria-labelledby="format-guides-title">
            <div>
              <h2 id="format-guides-title">Learn more about {info.label}</h2>
              <p>Compare formats and see what may change during conversion.</p>
            </div>
            <div className="guide-route-links">
              {guides.map((guide) => (
                <Link href={`/guides/${guide.slug}`} key={guide.slug}>
                  {guide.title} <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="faq-section" aria-labelledby="format-faq-title">
          <div className="faq-heading">
            <h2 id="format-faq-title">Questions about {info.label}</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary><span>{item.question}</span><span className="faq-toggle" aria-hidden="true" /></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
