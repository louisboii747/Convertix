import type { MetadataRoute } from "next";
import { getEnabledConversionPairs } from "@/lib/formats";
import { GUIDES } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk").replace(/\/$/, "");
  const contentUpdated = new Date("2026-08-20T00:00:00.000Z");

  return [
    { url: siteUrl, lastModified: contentUpdated },
    { url: `${siteUrl}/tools`, lastModified: contentUpdated },
    { url: `${siteUrl}/guides`, lastModified: contentUpdated },
    { url: `${siteUrl}/optimize-svg`, lastModified: contentUpdated },
    { url: `${siteUrl}/contact` },
    { url: `${siteUrl}/privacy` },
    ...GUIDES.map((guide) => ({ url: `${siteUrl}/guides/${guide.slug}`, lastModified: new Date(`${guide.updated}T00:00:00.000Z`) })),
    ...getEnabledConversionPairs().map((pair) => ({ url: `${siteUrl}/${pair.slug}`, lastModified: contentUpdated })),
  ];
}
