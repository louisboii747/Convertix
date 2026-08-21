import type { MetadataRoute } from "next";
import {
  FORMATS,
  getEnabledConversionPairs,
  type FormatId,
} from "@/lib/formats";
import { GUIDES } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk"
  ).replace(/\/$/, "");
  const enabledPairs = getEnabledConversionPairs();
  const liveFormats = Array.from(
    new Set(enabledPairs.flatMap((pair) => [pair.source, pair.target])),
  ) as FormatId[];

  return [
    { url: siteUrl },
    { url: `${siteUrl}/tools` },
    { url: `${siteUrl}/conversions` },
    { url: `${siteUrl}/formats` },
    { url: `${siteUrl}/guides` },
    {
      url: `${siteUrl}/guides/skate-webm-to-mp4`,
      lastModified: new Date("2026-08-21T00:00:00.000Z"),
    },
    { url: `${siteUrl}/merge-pdf` },
    { url: `${siteUrl}/compress-pdf` },
    { url: `${siteUrl}/compress-image` },
    { url: `${siteUrl}/optimize-svg` },
    { url: `${siteUrl}/contact` },
    { url: `${siteUrl}/privacy` },
    ...liveFormats
      .filter((format) => Boolean(FORMATS[format]))
      .map((format) => ({ url: `${siteUrl}/formats/${format}` })),
    ...GUIDES.map((guide) => ({
      url: `${siteUrl}/guides/${guide.slug}`,
      lastModified: new Date(`${guide.updated}T00:00:00.000Z`),
    })),
    ...enabledPairs.map((pair) => ({ url: `${siteUrl}/${pair.slug}` })),
  ];
}
