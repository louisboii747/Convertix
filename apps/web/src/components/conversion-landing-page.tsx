import Link from "next/link";
import { Converter } from "@/components/converter";
import {
  AccountIcon,
  ArrowIcon,
  DeviceIcon,
  RouteIcon,
} from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import {
  FORMAT_FAMILIES,
  FORMATS,
  getEnabledConversionPairs,
  isConversionPairEnabled,
  type ConversionPair,
} from "@/lib/formats";

const genericFaqItems = [
  {
    question: "Do I need an account to convert a file?",
    answer:
      "No. Basic file conversion is designed to work without creating an account. If accounts are added later, they will be for optional conveniences rather than access to the core workflow.",
  },
  {
    question: "Which conversions are available?",
    answer:
      "Convertix adds routes as soon as they’re ready. You’ll always see whether a conversion is available before you can send a file.",
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
  const allEnabledPairs = getEnabledConversionPairs();
  const relatedPairs = pair
    ? allEnabledPairs
        .filter((candidate) => candidate.slug !== pair.slug)
        .sort((a, b) => {
          const aRelated = a.source === pair.source || a.target === pair.target;
          const bRelated = b.source === pair.source || b.target === pair.target;

          if (aRelated === bRelated) {
            return Number(b.popular) - Number(a.popular);
          }

          return Number(bRelated) - Number(aRelated);
        })
        .slice(0, 6)
    : allEnabledPairs.filter((candidate) => candidate.popular);

  const source = pair ? FORMATS[pair.source] : null;
  const target = pair ? FORMATS[pair.target] : null;

  const pageTitle = pair
    ? `Convert ${source?.label} to ${target?.label} online.`
    : "Convert files without the fuss.";

  const pageDescription = pair
    ? routeEnabled
      ? `Convert ${source?.label} files to ${target?.label} online with Convertix. Upload your file, follow the conversion progress, and download the converted result when it’s ready.`
      : `${source?.label} to ${target?.label} is a recognised Convertix conversion route, but it isn’t available yet.`
    : "Choose a file, see its format, pick an available destination, and follow every step in one clear place.";

  const faqItems = pair
    ? [
        {
          question: `How do I convert ${source?.label} to ${target?.label}?`,
          answer: routeEnabled
            ? `Upload your ${source?.label} file, confirm ${target?.label} as the destination, start the conversion, and download the result when Convertix reports that it is ready.`
            : `${source?.label} to ${target?.label} is recognised by Convertix, but this route is not available for processing yet.`,
        },
        {
          question: `Is ${source?.label} to ${target?.label} conversion free?`,
          answer:
            "Basic Convertix conversions are designed to be available without requiring an account or a paid sign-up step.",
        },
        ...genericFaqItems.slice(2),
      ]
    : genericFaqItems;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbStructuredData = pair
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Convertix",
            item: "https://convertix.uk/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${source?.label} to ${target?.label}`,
            item: `https://convertix.uk/${pair.slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero-section" aria-labelledby="page-title">
          <div className="hero-copy">
            <h1 id="page-title">{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <Converter
            initialSource={pair?.source}
            initialTarget={pair?.target}
          />
          <div className="hero-notes" aria-label="Conversion basics">
            <span>No account for basic conversions</span>
            <span>Availability shown before submission</span>
            <span>Keyboard and touch friendly</span>
          </div>
        </section>

        {pair && source && target ? (
          <section className="process-section" aria-labelledby="about-conversion-title">
            <div className="process-intro">
              <h2 id="about-conversion-title">
                About {source.label} to {target.label} conversion
              </h2>
              <p>
                {source.name} files use the {source.label} format, while the
                converted result is produced as a {target.name}. Convertix keeps
                the route focused on that single job: choose the source file,
                confirm the destination format, convert, and download the result.
              </p>
            </div>
            <ol className="process-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Upload your {source.label}</strong>
                  <p>Select the file normally or drag it into the converter.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Convert to {target.label}</strong>
                  <p>Confirm the route and follow the live conversion status.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Download the result</strong>
                  <p>Save the converted {target.label} file when it is ready.</p>
                </div>
              </li>
            </ol>
          </section>
        ) : null}

        {relatedPairs.length > 0 ? (
          <section className="popular-section" aria-labelledby="popular-title">
            <div className="section-heading-row">
              <div>
                <h2 id="popular-title">
                  {pair ? "Related conversions" : "Popular conversions"}
                </h2>
                <p>
                  {pair
                    ? "Explore other conversion routes that are available now."
                    : "Available conversions appear here as soon as they’re ready."}
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
            className="process-section"
            id="how-it-works"
            aria-labelledby="process-title"
          >
            <div className="process-intro">
              <h2 id="process-title">One file. One clear route.</h2>
              <p>
                The interface stays simple because each decision appears only when
                you need it.
              </p>
            </div>
            <ol className="process-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Choose your file</strong>
                  <p>Select it normally or drag it into the converter.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Check the route</strong>
                  <p>We detect the source and show compatible destinations.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Follow the status</strong>
                  <p>Every confirmed step appears in plain language.</p>
                </div>
              </li>
            </ol>
          </section>
        ) : null}

        <section className="why-section" aria-labelledby="why-title">
          <div className="why-heading">
            <h2 id="why-title">Built around the file in front of you.</h2>
            <p>
              Convertix is designed for the moment when the format is the only
              thing standing between you and what comes next.
            </p>
          </div>
          <div className="why-points">
            <article>
              <AccountIcon />
              <h3>No account detour</h3>
              <p>Basic conversion starts with your file, not a sign-up form.</p>
            </article>
            <article>
              <RouteIcon />
              <h3>Only real routes</h3>
              <p>Unavailable processing paths stay visibly unavailable.</p>
            </article>
            <article>
              <DeviceIcon />
              <h3>Made for your screen</h3>
              <p>The same clear workflow adapts from phone to desktop.</p>
            </article>
          </div>
        </section>

        <section
          className="formats-section"
          id="formats"
          aria-labelledby="formats-title"
        >
          <div className="formats-heading">
            <h2 id="formats-title">Format coverage</h2>
            <p>
              Browse the formats Convertix recognises. Every conversion shows
              its availability before you add a file.
            </p>
          </div>
          <div className="format-families">
            {FORMAT_FAMILIES.map((family) => (
              <div className="format-family" key={family.id}>
                <h3>{family.label}</h3>
                <div className="format-tags">
                  {family.formats.map((formatId) => (
                    <span key={formatId}>{FORMATS[formatId].label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
      {breadcrumbStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData),
          }}
        />
      ) : null}
    </>
  );
}
