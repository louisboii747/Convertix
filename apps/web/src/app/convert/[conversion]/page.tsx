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
  return CONVERSION_PAIRS.map((pair) => ({ conversion: pair.slug }));
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

  return {
    title: `${source} to ${target} Converter`,
    description: `Convert ${source} files to ${target} online with Convertix. Fast, simple file conversion with a clear step-by-step workflow.`,
    alternates: {
      canonical: `/convert/${pair.slug}`,
    },
    robots: enabled
      ? { index: true, follow: true }
      : { index: false, follow: true },
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
