import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversionLandingPage } from "@/components/conversion-landing-page";
import {
  CONVERSION_PAIRS,
  FORMATS,
  getConversionPairBySlug,
  isConversionPairEnabled,
} from "@/lib/formats";

interface ConversionPageProps {
  params: Promise<{ conversion: string }>;
}

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

  const title = `${source} to ${target} Converter – Free Online Conversion`;

  const description =
    `Convert ${source} files to ${target} online with Convertix. ` +
    `Upload your file, convert it using a simple workflow, and download the result.`;

  return {
    title,

    description,

    alternates: {
      canonical: `/convert/${pair.slug}`,
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
      url: `/convert/${pair.slug}`,
      title: `${source} to ${target} Converter`,
      description: `Convert ${source} files to ${target} online with Convertix using a simple, straightforward workflow.`,
      siteName: "Convertix",
    },

    twitter: {
      card: "summary_large_image",
      title: `${source} to ${target} Converter`,
      description: `Convert ${source} files to ${target} online with Convertix.`,
    },
  };
}

export default async function ConversionPage({ params }: ConversionPageProps) {
  const { conversion } = await params;
  const pair = getConversionPairBySlug(conversion);

  if (!pair) {
    notFound();
  }

  return <ConversionLandingPage pair={pair} />;
}
