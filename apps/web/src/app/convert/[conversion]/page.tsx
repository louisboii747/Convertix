import { notFound, permanentRedirect } from "next/navigation";
import {
  CONVERSION_PAIRS,
  getConversionPairBySlug,
} from "@/lib/formats";

interface LegacyConversionPageProps {
  params: Promise<{ conversion: string }>;
}

export function generateStaticParams() {
  return CONVERSION_PAIRS.map((pair) => ({
    conversion: pair.slug,
  }));
}

export default async function LegacyConversionPage({
  params,
}: LegacyConversionPageProps) {
  const { conversion } = await params;
  const pair = getConversionPairBySlug(conversion);

  if (!pair) {
    notFound();
  }

  permanentRedirect(`/${pair.slug}`);
}
