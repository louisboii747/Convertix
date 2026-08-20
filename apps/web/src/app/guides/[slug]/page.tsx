import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { GUIDES, getGuide } from "@/lib/guides";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  const canonical = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: guide.title,
      description: guide.description,
      siteName: "Convertix",
      modifiedTime: guide.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const related = guide.related.map(getGuide).filter((item) => item !== undefined);
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.updated,
    dateModified: guide.updated,
    mainEntityOfPage: `https://convertix.uk/guides/${guide.slug}`,
    author: { "@type": "Organization", name: "Convertix", url: "https://convertix.uk" },
    publisher: { "@type": "Organization", name: "Convertix", url: "https://convertix.uk" },
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="guide-article-page">
        <article className="guide-article">
          <nav className="guide-breadcrumb" aria-label="Breadcrumb">
            <Link href="/guides">Guides</Link><span aria-hidden="true">/</span><span>{guide.eyebrow}</span>
          </nav>
          <header className="guide-article-header">
            <span className="section-kicker">{guide.eyebrow}</span>
            <h1>{guide.title}</h1>
            <p>{guide.intro}</p>
            <small>Updated 20 August 2026 · Convertix Guides</small>
          </header>

          <div className="guide-article-body">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              </section>
            ))}
          </div>

          <aside className="guide-route-cta" aria-label="Related Convertix tools">
            <div><span className="section-kicker">Try it in Convertix</span><h2>Ready to convert?</h2><p>Jump directly into a live route related to this guide.</p></div>
            <div className="guide-route-links">
              {guide.routes.map((route) => <Link href={route.href} key={route.href}>{route.label}<ArrowIcon /></Link>)}
            </div>
          </aside>

          {related.length ? <section className="guide-related" aria-labelledby="related-guides-title"><h2 id="related-guides-title">Keep reading</h2><div className="guide-related-links">{related.map((item) => <Link href={`/guides/${item.slug}`} key={item.slug}><span>{item.eyebrow}</span><strong>{item.title}</strong><ArrowIcon /></Link>)}</div></section> : null}
        </article>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }} />
    </>
  );
}
