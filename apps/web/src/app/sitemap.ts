import type { MetadataRoute } from "next";
import { FORMATS, getEnabledConversionPairs, type FormatId } from "@/lib/formats";
import { GUIDES } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk").replace(/\/$/, "");
  const contentUpdated = new Date("2026-08-21T00:00:00.000Z");
  const enabledPairs = getEnabledConversionPairs();
  const liveFormats = Array.from(
    new Set(enabledPairs.flatMap((pair) => [pair.source, pair.target])),
  ) as FormatId[];

  return [
    { url: siteUrl, lastModified: contentUpdated },
    { url: `${siteUrl}/tools`, lastModified: contentUpdated },
    { url: `${siteUrl}/conversions`, lastModified: contentUpdated },
    { url: `${siteUrl}/formats`, lastModified: contentUpdated },
    { url: `${siteUrl}/guides`, lastModified: contentUpdated },
    { url: `${siteUrl}/optimize-svg`, lastModified: contentUpdated },
    { url: `${siteUrl}/contact` },
    { url: `${siteUrl}/privacy` },
    ...liveFormats
      .filter((format) => Boolean(FORMATS[format]))
      .map((format) => ({ url: `${siteUrl}/formats/${format}`, lastModified: contentUpdated })),
    ...GUIDES.map((guide) => ({ url: `${siteUrl}/guides/${guide.slug}`, lastModified: new Date(`${guide.updated}T00:00:00.000Z`) })),
    ...enabledPairs.map((pair) => ({ url: `${siteUrl}/${pair.slug}`, lastModified: contentUpdated })),
  ];
}
