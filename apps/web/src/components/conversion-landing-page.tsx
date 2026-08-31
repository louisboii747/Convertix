import Link from "next/link";
import { Converter } from "@/components/converter";
import { ImageToPdfConverter } from "@/components/image-to-pdf-converter";
import { ArrowIcon, RouteIcon } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { SupportedFormats } from "@/components/supported-formats";
import { FlowButton } from "@/components/ui/flow-button";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { GUIDES } from "@/lib/guides";
import { getConversionContent } from "@/lib/conversion-content";
import {
  FORMATS,
  getConversionPairLabel,
  getEnabledConversionPairs,
  isConversionPairEnabled,
  type ConversionPair,
} from "@/lib/formats";

const genericFaqItems = [
  {
    question: "Which files can I convert?",
    answer:
      "Convertix shows the output formats available for your file. You cannot start a conversion that the service does not support.",
  },
  {
    question: "What happens to my file?",
    answer:
      "Your file stays on your device until you start the conversion. Convertix does not publish a deletion time until the service can enforce it.",
  },
  {
    question: "Can I use Convertix on my phone?",
    answer:
      "Yes. You can choose a file and run a conversion from a phone, tablet, laptop, or desktop browser.",
  },
] as const;

const SEARCH_INTENT_HEADINGS: Partial<Record<string, string>> = {
  "docx-to-pdf": "Word to PDF Converter",
  "xlsx-to-pdf": "Excel to PDF Converter",
  "png-to-jpg": "PNG to JPG Converter",
  "jpg-to-png": "JPG to PNG Converter",
  "jpg-to-pdf": "JPG to PDF Converter",
  "png-to-pdf": "PNG to PDF Converter",
  "svg-to-png": "SVG to PNG Converter",
  "mp3-to-wav": "MP3 to WAV Converter",
  "wav-to-mp3": "WAV to MP3 Converter",
  "txt-to-docx": "TXT to DOCX Converter",
  "webp-to-png": "WebP to PNG Converter",
  "webm-to-mp4": "WebM to MP4 Converter",
};

interface ConversionLandingPageProps {
  pair?: ConversionPair;
}

export function ConversionLandingPage({ pair }: ConversionLandingPageProps) {
  const routeEnabled = pair ? isConversionPairEnabled(pair) : true;
  const conversionContent = pair ? getConversionContent(pair.slug) : null;
  const relatedGuides =
    pair?.source === "heic"
      ? GUIDES.filter((guide) =>
          [
            "heic-vs-jpg",
            "open-heic-on-windows",
            "why-iphone-uses-heic",
            "heic-vs-png",
          ].includes(guide.slug),
        )
      : [];
  const allEnabledPairs = getEnabledConversionPairs();
  const liveFormatIds = Array.from(
    new Set(
      allEnabledPairs.flatMap((candidate) => [
        candidate.source,
        candidate.target,
      ]),
    ),
  );
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
  const isImagePdfPair = Boolean(
    pair &&
    pair.target === "pdf" &&
    (pair.source === "jpg" || pair.source === "png"),
  );
  const pageTitle = pair
    ? (SEARCH_INTENT_HEADINGS[pair.slug] ??
      `Convert ${getConversionPairLabel(pair)}`)
    : "Convert files online without the fuss.";

  const pageDescription = pair
    ? routeEnabled
      ? isImagePdfPair
        ? `Choose one or more ${source?.label} images, set their page order, and download one PDF.`
        : `Choose a ${source?.label} file and download a ${target?.label} when the conversion finishes.`
      : `Convertix recognises ${source?.label} to ${target?.label}, but cannot process it yet.`
    : "Choose a file and Convertix will show the formats it can convert to.";

  const faqItems = pair
    ? [
        {
          question: `How do I convert ${source?.label} to ${target?.label}?`,
          answer: routeEnabled
            ? isImagePdfPair
              ? `Choose up to 20 ${source?.label} images, arrange them in the order you want, then choose Create PDF. Each image becomes one PDF page.`
              : `Choose a ${source?.label} file, select ${target?.label}, then start the conversion. Convertix will show a download button when the file is ready.`
            : `Convertix recognises ${source?.label} to ${target?.label}, but cannot process it yet.`,
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
            {pair ? (
              <h1 id="page-title">{pageTitle}</h1>
            ) : (
              <h1 id="page-title">
                <span className="sr-only">
                  Convert files online without the fuss.
                </span>
                <span aria-hidden="true" className="grid">
                  <TypingAnimation
                    words={[
                      "Convert files online",
                      "Compress PDFs online",
                      "Optimize images online",
                      "Convert files online",
                    ]}
                    typeSpeed={45}
                    deleteSpeed={25}
                    pauseDelay={1100}
                    loop={false}
                    startOnView={false}
                    showCursor={true}
                    blinkCursor={true}
                    cursorStyle="line"
                    reducedMotionText="Convert files online"
                  />
                  <span>without the fuss.</span>
                </span>
              </h1>
            )}
            <p>{pageDescription}</p>
          </div>
          {isImagePdfPair && pair ? (
            <ImageToPdfConverter sourceFormat={pair.source as "jpg" | "png"} />
          ) : (
            <Converter
              initialSource={pair?.source}
              initialTarget={pair?.target}
            />
          )}
          <div className="hero-notes" aria-label="Conversion basics">
            <span>No account needed</span>
            <span>
              {isImagePdfPair
                ? "Up to 20 images · 100 MB total"
                : "100 MB file limit"}
            </span>
            <span>
              {isImagePdfPair
                ? "Images upload only when you create the PDF"
                : "Your file uploads only when you start"}
            </span>
          </div>
        </section>

        {!pair ? (
          <section
            className="batch-feature-section"
            aria-labelledby="batch-feature-title"
          >
            <div className="batch-feature-copy">
              <span className="batch-feature-eyebrow">Browser tool</span>
              <h2 id="batch-feature-title">
                Compress up to 30 images at once.
              </h2>
              <p>
                Batch-compress JPG, PNG, and WebP images without uploading them
                to Convertix. Process the set on your device, then download each
                result or package the successful files into one ZIP.
              </p>
              <div
                className="batch-feature-badges"
                aria-label="Batch image compressor features"
              >
                <span>Up to 30 images</span>
                <span>Runs in your browser</span>
                <span>Download all as ZIP</span>
              </div>
              <FlowButton
                className="mt-6"
                href="/compress-image"
                variant="primary"
                shape="rounded"
                text="Open batch image compressor"
              />
            </div>

            <div className="batch-feature-preview" aria-label="Batch workflow">
              <strong>Batch workflow</strong>
              <ol>
                <li>
                  <span aria-hidden="true">1</span>
                  <div>
                    <strong>Add your images</strong>
                    <small>JPG, PNG, and WebP</small>
                  </div>
                </li>
                <li>
                  <span aria-hidden="true">2</span>
                  <div>
                    <strong>Choose compression</strong>
                    <small>Light, Balanced, or Maximum</small>
                  </div>
                </li>
                <li>
                  <span aria-hidden="true">3</span>
                  <div>
                    <strong>Download the results</strong>
                    <small>Individually or as one ZIP</small>
                  </div>
                </li>
              </ol>
              <p>Images stay on your device for this tool.</p>
            </div>
          </section>
        ) : null}

        {relatedPairs.length > 0 ? (
          <section className="popular-section" aria-labelledby="popular-title">
            <div className="section-heading-row">
              <div>
                <h2 id="popular-title">
                  {pair ? "More conversions" : "Common conversions"}
                </h2>
                <p>
                  {pair
                    ? "Choose another format pair to open its converter."
                    : "Start with one of these format pairs."}
                </p>
              </div>
            </div>
            <div className="popular-links">
              {relatedPairs.map((enabledPair) => (
                <Link key={enabledPair.slug} href={`/${enabledPair.slug}`}>
                  <span>{getConversionPairLabel(enabledPair)}</span>
                  <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="process-section"
          id="how-it-works"
          aria-labelledby="process-title"
        >
          <div className="process-intro">
            <h2 id="process-title">
              {pair
                ? `How to convert ${source?.label} to ${target?.label}`
                : "How to convert a file"}
            </h2>
            <p>
              {pair
                ? `Choose a ${source?.label} file, convert it to ${target?.label}, and download the result when it is ready.`
                : "Choose the file and output format in the same converter. The status stays visible until the download is ready."}
            </p>
          </div>
          <ol className="process-list">
            <li>
              <span aria-hidden="true">1</span>
              <div>
                <strong>
                  {pair ? `Choose a ${source?.label} file` : "Choose a file"}
                </strong>
                <p>
                  {pair
                    ? `Pick a ${source?.label} file from your device or drop it into the converter.`
                    : "Pick one from your device or drop it into the converter."}
                </p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <div>
                <strong>
                  {pair ? `Convert to ${target?.label}` : "Choose the output"}
                </strong>
                <p>
                  {pair
                    ? `${target?.label} is preselected on this converter page. Start the conversion when your file is ready.`
                    : "Convertix shows the formats available for that file."}
                </p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <div>
                <strong>
                  {pair
                    ? `Download the ${target?.label}`
                    : "Download the result"}
                </strong>
                <p>
                  {pair
                    ? `Keep this page open while Convertix processes the file, then download the finished ${target?.label}.`
                    : "Start the conversion and keep this page open until it finishes."}
                </p>
              </div>
            </li>
          </ol>
        </section>

        {pair && conversionContent ? (
          <section
            className="why-section"
            aria-labelledby="conversion-insights-title"
          >
            <div className="why-heading">
              <h2 id="conversion-insights-title">
                About {source?.label} to {target?.label}
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

        <section
          className="formats-section format-cloud-section"
          id="formats"
          aria-labelledby="formats-title"
        >
          <div className="formats-heading">
            <h2 id="formats-title">Supported formats</h2>
            <p>
              Choose a format to see what it is used for and which live
              conversions are available.
            </p>
          </div>
          <SupportedFormats formatIds={liveFormatIds} />
        </section>

        {relatedGuides.length > 0 ? (
          <section className="guides-promo" aria-labelledby="heic-guides-title">
            <div>
              <h2 id="heic-guides-title">Learn more about HEIC photos</h2>
              <p>
                Understand iPhone HEIC files, compatibility, and which image
                format to choose.
              </p>
            </div>

            <div className="guide-route-links">
              {relatedGuides.map((guide) => (
                <Link href={`/guides/${guide.slug}`} key={guide.slug}>
                  {guide.title} <ArrowIcon />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="guides-promo" aria-labelledby="guides-promo-title">
          <div>
            <h2 id="guides-promo-title">Compare formats before you convert</h2>
            <p>
              The guides explain what each format keeps, where it works well,
              and what may change during conversion.
            </p>
          </div>
          <FlowButton
            href="/guides"
            variant="dark"
            shape="rounded"
            text="Read the guides"
          />
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="faq-heading">
            <h2 id="faq-title">Questions about file conversion</h2>
            <p>Answers about supported files and how Convertix handles them.</p>
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
