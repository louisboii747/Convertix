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
  "docx-to-pdf": {
    title: "Word to PDF Converter | Convert DOCX to PDF Online",
    description:
      "Convert Word documents to PDF online with Convertix. Turn DOCX files into easy-to-share PDF documents quickly and easily.",
    keywords: [
      "word to pdf",
      "docx to pdf",
      "convert word to pdf",
      "word to pdf converter",
      "convert docx to pdf",
      "docx to pdf online",
    ],
  },
  "xlsx-to-pdf": {
    title: "XLSX to PDF Converter | Convert Excel to PDF Online",
    description:
      "Convert XLSX to PDF online with Convertix. Upload an Excel workbook and download a fixed-layout PDF for sharing, printing, or submitting. No account required.",
    keywords: [
      "xlsx to pdf",
      "xlsx to pdf converter",
      "convert xlsx to pdf",
      "xlsx to pdf online",
      "excel to pdf",
      "convert excel to pdf",
      "excel spreadsheet to pdf",
    ],
  },
  "png-to-jpg": {
    title: "PNG to JPG Converter | Convert PNG to JPEG Online",
    description:
      "Convert PNG images to JPG online with Convertix. Turn PNG files into widely supported JPEG images for easier sharing and smaller file sizes.",
    keywords: [
      "png to jpg",
      "png to jpeg",
      "convert png to jpg",
      "convert png to jpeg",
      "png to jpg converter",
      "png to jpeg online",
    ],
  },
  "jpg-to-png": {
    title: "JPG to PNG Converter | Convert JPEG to PNG Online",
    description:
      "Convert JPG and JPEG images to PNG online with Convertix. Turn JPEG files into PNG images for editing, compatibility, and lossless re-saving.",
    keywords: [
      "jpg to png",
      "jpeg to png",
      "convert jpg to png",
      "convert jpeg to png",
      "jpg to png converter",
      "jpeg to png online",
    ],
  },
  "jpg-to-pdf": {
    title: "JPG to PDF Converter | Convert JPEG to PDF Online",
    description:
      "Convert JPG and JPEG images to PDF online with Convertix. Fit the full image onto a clean PDF page without cropping.",
    keywords: [
      "jpg to pdf",
      "jpeg to pdf",
      "convert jpg to pdf",
      "image to pdf",
      "jpg to pdf converter",
      "jpeg to pdf online",
    ],
  },
  "png-to-pdf": {
    title: "PNG to PDF Converter | Convert PNG Images to PDF Online",
    description:
      "Convert PNG images to PDF online with Convertix. Fit the complete image onto a clean PDF page while preserving its aspect ratio.",
    keywords: [
      "png to pdf",
      "convert png to pdf",
      "image to pdf",
      "png to pdf converter",
      "png image to pdf",
      "png to pdf online",
    ],
  },
  "svg-to-png": {
    title: "SVG to PNG Converter | Convert SVG Images Online",
    description:
      "Convert SVG vector graphics to PNG online with Convertix. Create fixed-resolution PNG images for apps, websites, uploads, and sharing.",
    keywords: [
      "svg to png",
      "convert svg to png",
      "svg to png converter",
      "vector to png",
      "svg image to png",
      "svg to png online",
    ],
  },
  "svg-to-webp": {
    title: "SVG to WebP Converter | Convert SVG Images Online",
    description:
      "Convert SVG to WebP online with Convertix. No account required. Turn vector graphics into fixed-resolution WebP images for websites, apps, and sharing.",
    keywords: [
      "svg to webp",
      "convert svg to webp",
      "svg to webp converter",
      "vector to webp",
      "svg image to webp",
      "svg to webp online",
    ],
  },
  "mp3-to-wav": {
    title: "MP3 to WAV Converter | Free Online Audio Converter",
    description:
      "Convert MP3 to WAV online with Convertix. No account required. Upload an MP3 file up to 100 MB and download the converted WAV when it is ready.",
    keywords: [
      "mp3 to wav",
      "convert mp3 to wav",
      "mp3 to wav converter",
      "audio to wav",
      "mp3 audio to wav",
      "mp3 to wav online",
    ],
  },
  "wav-to-mp3": {
    title: "WAV to MP3 Converter | Convert Audio Online",
    description:
      "Convert WAV audio files to MP3 online with Convertix. Create smaller, widely compatible MP3 files for sharing and playback.",
    keywords: [
      "wav to mp3",
      "convert wav to mp3",
      "wav to mp3 converter",
      "audio to mp3",
      "wav audio to mp3",
      "wav to mp3 online",
    ],
  },
  "txt-to-docx": {
    title: "TXT to DOCX Converter | Convert Text Files to Word Online",
    description:
      "Convert TXT to DOCX online with Convertix. Turn a plain-text file into an editable Word document with no account required.",
    keywords: [
      "txt to docx",
      "txt to docx converter",
      "txt to word converter",
      "text to docx",
      "convert txt to word",
      "text file to word",
      "txt to docx online",
    ],
  },
  "webp-to-png": {
    title: "Convert WebP to PNG Online | Keep Transparency",
    description:
      "Convert WebP images to PNG online for broader compatibility and transparency support. Choose a WebP file and download the converted PNG.",
    keywords: [
      "webp to png",
      "convert webp to png",
      "webp transparency to png",
      "downloaded webp to png",
      "webp to png online",
    ],
  },
  "webm-to-mp4": {
    title: "Convert WebM to MP4 Online | Video & Screen Recordings",
    description:
      "Convert WebM video and screen recordings to MP4 online for playback, editing and sharing. Works with browser recordings, OBS exports and other WebM files.",
    keywords: [
      "webm to mp4",
      "convert webm to mp4",
      "obs webm to mp4",
      "screen recording webm to mp4",
      "webm to mp4 online",
    ],
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
  const title =
    searchIntent?.title ??
    `Convert ${source} to ${target} Online | Free Converter`;
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
