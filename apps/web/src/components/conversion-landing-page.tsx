import Link from "next/link";
import { Converter } from "@/components/converter";
import { FeatureMarquee } from "@/components/feature-marquee";
import { ArrowIcon, DeviceIcon, RouteIcon } from "@/components/icons";
import { FormatMark } from "@/components/format-mark";
import { SiteHeader } from "@/components/site-header";
import { getConversionContent } from "@/lib/conversion-content";
import {
  FORMAT_FAMILIES,
  FORMATS,
  getEnabledConversionPairs,
  isConversionPairEnabled,
  type ConversionPair,
} from "@/lib/formats";

const genericFaqItems = [
  {
    question: "Which conversions are available?",
    answer:
      "Convertix only exposes routes that are wired into the live conversion service. If a route is not ready, it is marked unavailable before you can start it.",
  },
  {
    question: "What happens to my file?",
    answer:
      "Convertix won’t promise a deletion window or security feature until it can guarantee it. You’ll see the exact file-handling details before any available conversion starts.",
  },
  {
    question: "Can I use Convertix on my phone?",
    answer:
      "Yes. The web experience is built for keyboard, touch, and screen readers across phones, tablets, laptops, and desktop browsers.",
  },
] as const;

function formatPairLabel(pair: ConversionPair) {
  return `${FORMATS[pair.source].label} to ${FORMATS[pair.target].label}`;
}

interface ConversionLandingPageProps {
  pair?: ConversionPair;
}

export function ConversionLandingPage({ pair }: ConversionLandingPageProps) {
  const routeEnabled = pair ? isConversionPairEnabled(pair) : true;
  const conversionContent = pair ? getConversionContent(pair.slug) : null;
  const allEnabledPairs = getEnabledConversionPairs();
  const relatedPairs = pair
    ? allEnabledPairs
        .filter((candidate) => candidate.slug !== pair.slug)
        .sort((a, b) => {
          const aRelated = a.source === pair.source || a.target === pair.target;
          const bRelated = b.source === pair.source || b.target === pair.target;
          if (aRelated === bRelated)
            return Number(b.popular) - Number(a.popular);
          return Number(bRelated) - Number(aRelated);
        })
        .slice(0, 6)
    : allEnabledPairs.filter((candidate) => candidate.popular);

  const source = pair ? FORMATS[pair.source] : null;
  const target = pair ? FORMATS[pair.target] : null;
  const pageTitle = pair
    ? `Turn ${source?.label} into ${target?.label} without the detour.`
    : "Get the file format you need. Fast.";

  const pageDescription = pair
    ? routeEnabled
      ? `Drop in your ${source?.label}, convert it to ${target?.label}, and download the result from one focused workflow.`
      : `${source?.label} to ${target?.label} is a recognised Convertix route, but it is not available for processing yet.`
    : "Drop in a file, Convertix detects what it is, then reveals only the destinations that actually work.";

  const faqItems = pair
    ? [
        {
          question: `How do I convert ${source?.label} to ${target?.label}?`,
          answer: routeEnabled
            ? `Choose your ${source?.label} file, confirm ${target?.label} as the destination, start the conversion, and download the result when it is ready.`
            : `${source?.label} to ${target?.label} is recognised by Convertix, but this route is not available for processing yet.`,
        },
        ...(conversionContent?.faq ?? []),
        ...genericFaqItems,
      ]
    : genericFaqItems;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="page-title">
          <div className="hero-copy hero-copy-benefit">
            <span className="hero-eyebrow">One file in. The right format out.</span>
            <h1 id="page-title">{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <Converter initialSource={pair?.source} initialTarget={pair?.target} />
          <div className="hero-notes" aria-label="Conversion basics">
            <span>Available routes are verified up front</span>
            <span>Progress stays visible while the job runs</span>
            <span>Works across desktop and mobile</span>
          </div>
        </section>

        {!pair ? <FeatureMarquee /> : null}

        {relatedPairs.length > 0 ? (
          <section className="popular-section" aria-labelledby="popular-title">
            <div className="section-heading-row">
              <div>
                <h2 id="popular-title">
                  {pair ? "Related conversions" : "Popular conversions"}
                </h2>
                <p>
                  {pair
                    ? "Other routes that are live now."
                    : "Jump straight into a route people use most."}
                </p>
              </div>
            </div>
            <div className="popular-links">
              {relatedPairs.map((enabledPair) => (
                <Link key={enabledPair.slug} href={`/${enabledPair.slug}`}>
                  <span>{formatPairLabel(enabledPair)}</span>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!pair ? (
          <section
            className="route-showcase"
            id="how-it-works"
            aria-labelledby="route-showcase-title"
          >
            <div className="route-showcase-copy">
              <span className="section-kicker">Quick and easy</span>
              <h2 id="route-showcase-title">
                Your file gets one obvious path to the result.
              </h2>
              <p>
                No wall of controls. Pick a file first; Convertix detects the
                source, lights up a valid route, then stays out of the way while
                it converts.
              </p>
            </div>
            <div className="route-demo" aria-label="Animated example conversion routes">
              <div className="route-demo-file">
                <FormatMark format="docx" />
                <span>report.docx</span>
              </div>
              <div className="route-demo-track" aria-hidden="true"><span /></div>
              <div className="route-demo-targets">
                <div className="route-demo-target is-active">
                  <FormatMark format="pdf" compact />
                  <span>PDF</span>
                </div>
                <div className="route-demo-target">
                  <FormatMark format="txt" compact />
                  <span>TXT</span>
                </div>
                <div className="route-demo-target">
                  <FormatMark format="png" compact />
                  <span>PNG</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {pair && conversionContent ? (
          <section className="why-section" aria-labelledby="conversion-insights-title">
            <div className="why-heading">
              <span className="section-kicker">About this conversion</span>
              <h2 id="conversion-insights-title">
                What to know about {source?.label} to {target?.label}.
              </h2>
              <p>{conversionContent.intro}</p>
            </div>
            <div className="why-points">
              {conversionContent.highlights.map((highlight) => (
                <article key={highlight.heading}>
                  <RouteIcon />
                  <h3>{highlight.heading}</h3>
                  <p>{highlight.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="why-section" aria-labelledby="why-title">
          <div className="why-heading">
            <h2 id="why-title">Less friction. More certainty.</h2>
            <p>
              Convertix is built around getting a usable result quickly, while
              being clear about what is and is not live.
            </p>
          </div>
          <div className="why-points">
            <article>
              <RouteIcon />
              <h3>Real routes only</h3>
              <p>If processing is not wired up, the interface will not pretend that it is.</p>
            </article>
            <article>
              <DeviceIcon />
              <h3>Progressive workflow</h3>
              <p>Each decision appears after the previous one, so the converter stays calm and obvious.</p>
            </article>
            <article>
              <ArrowIcon />
              <h3>Built to finish the job</h3>
              <p>Upload, status, conversion and download live in one continuous flow.</p>
            </article>
          </div>
        </section>

        <section
          className="formats-section format-cloud-section"
          id="formats"
          aria-labelledby="formats-title"
        >
          <div className="formats-heading">
            <h2 id="formats-title">Formats at a glance</h2>
            <p>
              A visual map of the file types Convertix recognises, without
              making static labels look like buttons.
            </p>
          </div>
          <div className="format-cloud" aria-label="Recognised file formats">
            {FORMAT_FAMILIES.flatMap((family) =>
              family.formats.map((formatId) => (
                <div className="format-cloud-item" key={formatId}>
                  <FormatMark format={formatId} />
                  <span>{FORMATS[formatId].label}</span>
                  <small>{FORMATS[formatId].name}</small>
                </div>
              )),
            )}
          </div>
        </section>

        <section className="guides-promo" aria-labelledby="guides-promo-title">
          <div>
            <span className="section-kicker">Useful beyond the converter</span>
            <h2 id="guides-promo-title">Learn which format actually fits the job.</h2>
            <p>
              Convertix Guides gives the site an indexable knowledge layer with
              practical format comparisons and conversion advice.
            </p>
          </div>
          <Link href="/guides" className="guides-promo-link">
            Explore guides <ArrowIcon />
          </Link>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="faq-heading">
            <h2 id="faq-title">Good to know before you convert.</h2>
            <p>Short answers, with no promises the product cannot keep.</p>
          </div>
          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <span className="faq-toggle" aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  );
}
