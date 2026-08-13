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

const faqItems = [
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
  const enabledPairs = getEnabledConversionPairs().filter(
    (candidate) => candidate.popular,
  );
  const routeEnabled = pair ? isConversionPairEnabled(pair) : true;
  const pageTitle = pair
    ? `Convert ${FORMATS[pair.source].label} to ${FORMATS[pair.target].label} without the fuss.`
    : "Convert files without the fuss.";
  const pageDescription = pair
    ? `Choose a ${FORMATS[pair.source].label} file and follow one clear route to ${FORMATS[pair.target].label}. ${routeEnabled ? "This conversion is ready to use." : "This conversion isn’t available yet."}`
    : "Choose a file, see its format, pick an available destination, and follow every step in one clear place.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Convertix",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    description:
      "A simple, accessible way to follow available file conversions.",
  };

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

        <section className="popular-section" aria-labelledby="popular-title">
          <div className="section-heading-row">
            <div>
              <h2 id="popular-title">Popular conversions</h2>
              <p>Available conversions appear here as soon as they’re ready.</p>
            </div>
          </div>

          {enabledPairs.length > 0 ? (
            <div className="popular-links">
              {enabledPairs.map((enabledPair) => (
                <Link
                  key={enabledPair.slug}
                  href={`/convert/${enabledPair.slug}`}
                >
                  <span>{formatPairLabel(enabledPair)}</span>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          ) : (
            <div className="popular-empty">
              <span>First route planned</span>
              <strong>DOCX to PDF</strong>
              <p>
                Conversion links will appear here when they’re ready to use.
              </p>
            </div>
          )}
        </section>

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

      <footer className="site-footer">
        <div className="footer-lead">
          <span className="footer-wordmark">Convertix</span>
          <p>Convert your files with ease and speed.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#formats">Formats</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <p className="footer-note">
          Availability is always shown before a file can be sent.
        </p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  );
}
