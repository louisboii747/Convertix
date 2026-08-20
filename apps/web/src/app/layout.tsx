import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./converter-feedback.css";
import "./feedback-polish.css";
import { SiteFooter } from "@/components/site-footer";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";

const displayFont = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const bodyFont = Figtree({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Convertix — Free Online File Converter", template: "%s — Convertix" },
  description: "Convert files online with Convertix. Upload a file, choose an available format, and download the converted result with a simple, secure conversion workflow.",
  applicationName: "Convertix",
  keywords: ["file converter", "online file converter", "free file converter", "convert files online", "DOCX to PDF", "document converter", "image converter", "file format guides"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", url: "/", siteName: "Convertix", title: "Convertix — Free Online File Converter", description: "Convert files online with a simple, secure workflow. Upload a file, choose an available format, and download the result." },
  twitter: { card: "summary_large_image", title: "Convertix — Free Online File Converter", description: "Convert files online with a simple, secure workflow. Upload a file, choose an available format, and download the result." },
};

const directionContract = `<!--
THESIS: A file converter is one clear route, not a marketing landing page; the task owns the first viewport.
OWN-WORLD: Mineral-white fields, deep-navy type, a cobalt route line and actions, and mint reserved for confirmed success; precise rules, flat surfaces, and 14–18px corners.
STORY: Select a file, understand its detected format, choose an enabled target, submit, and read one honest lifecycle.
FIRST VIEWPORT: Compact header and centered display headline above one wide continuous converter; file selection first, route steps next, full-width action, live status last.
FORM: Familiar consumer convention at full craft, approved Single Flow composition, seed key ea5e2193.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Convertix",
    url: siteUrl,
    description: "Free online file conversion tools and practical file format guides.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Convertix",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Convert files online with Convertix using a simple, secure conversion workflow.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="direction-contract" aria-hidden="true" dangerouslySetInnerHTML={{ __html: directionContract }} />
        <a className="skip-link" href="#main-content">Skip to converter</a>
        {children}
        <SiteFooter />
        <AnalyticsConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
