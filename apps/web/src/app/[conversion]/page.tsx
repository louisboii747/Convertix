import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConversionLandingPage } from "@/components/conversion-landing-page";
import { getConversionContent } from "@/lib/conversion-content";
import {
  CONVERSION_PAIRS,
  FORMATS,
  getConversionPairBySlug,
  isConversionPairEnabled,
} from "@/lib/formats";

interface ConversionPageProps {
  params: Promise<{ conversion: string }>;
}

const SEARCH_INTENT_METADATA: Partial<
  Record<string, { title: string; description: string; keywords: string[] }>
> = {
  "txt-to-docx": {
    title: "Convert TXT to DOCX Online | Text File to Word",
    description:
      "Convert a TXT file to an editable Word DOCX document online. Choose a plain-text file and download the converted DOCX.",
    keywords: ["txt to docx", "text file to word", "convert txt to word", "notepad to word", "txt to docx online"],
  },
  "webp-to-png": {
    title: "Convert WebP to PNG Online | Keep Transparency",
    description:
      "Convert WebP images to PNG online for broader compatibility and transparency support. Choose a WebP file and download the converted PNG.",
    keywords: ["webp to png", "convert webp to png", "webp transparency to png", "downloaded webp to png", "webp to png online"],
  },
  "webm-to-mp4": {
    title: "Convert WebM to MP4 Online | Video & Screen Recordings",
    description:
      "Convert WebM video and screen recordings to MP4 online for playback, editing and sharing. Works with browser recordings, OBS exports and other WebM files.",
    keywords: ["webm to mp4", "convert webm to mp4", "obs webm to mp4", "screen recording webm to mp4", "webm to mp4 online"],
  },
};

export function generateStaticParams() {
  return CONVERSION_PAIRS.map((pair) => ({
    conversion: pair.slug,
  }));
}

export async function generateMetadata({
  params,
}: ConversionPageProps): Promise<Metadata> {
  const { conversion } = await params;
  const pair = getConversionPairBySlug(conversion);

  if (!pair) {
    return {};
  }

  const source = FORMATS[pair.source].label;
  const target = FORMATS[pair.target].label;
  const enabled = isConversionPairEnabled(pair);
  const canonicalPath = `/${pair.slug}`;
  const searchIntent = SEARCH_INTENT_METADATA[pair.slug];
  const title = searchIntent?.title ?? `Convert ${source} to ${target} Online | Free Converter`;
  const description =
    searchIntent?.description ??
    `Convert ${source} files to ${target} online with Convertix. Choose a ${source} file and download the converted ${target}.`;

  return {
    title,
    description,
    ...(searchIntent?.keywords ? { keywords: searchIntent.keywords } : {}),
    alternates: {
      canonical: canonicalPath,
    },
    robots: enabled
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: true,
        },
    openGraph: {
      type: "website",
      url: canonicalPath,
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

export default async function ConversionPage({ params }: ConversionPageProps) {
  const { conversion } = await params;
  const pair = getConversionPairBySlug(conversion);

  if (!pair) {
    notFound();
  }

  const source = FORMATS[pair.source].label;
  const target = FORMATS[pair.target].label;
  const content = getConversionContent(pair.slug);
  const canonicalUrl = `https://convertix.uk/${pair.slug}`;

  const pageStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: `Convert ${source} to ${target} Online`,
        description:
          content?.intro ??
          `Convert ${source} files to ${target} online with Convertix.`,
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
          {
            "@type": "ListItem",
            position: 1,
            name: "Convertix",
            item: "https://convertix.uk",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Conversions",
            item: "https://convertix.uk/conversions",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${source} to ${target}`,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <ConversionLandingPage pair={pair} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData) }}
      />
    </>
  );
}
