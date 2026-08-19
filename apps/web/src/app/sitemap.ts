import type { MetadataRoute } from "next";
import { getEnabledConversionPairs } from "@/lib/formats";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (
    process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk"
  ).replace(/\/$/, "");

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...getEnabledConversionPairs().map((pair) => ({
      url: `${siteUrl}/convert/${pair.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
