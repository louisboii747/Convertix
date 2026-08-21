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
const siteUrl = (process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "https://convertix.uk").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Convertix | Free Online File Converter", template: "%s | Convertix" },
  description: "Convert files online with Convertix. Choose a file, select an output format, and download the converted file.",
  applicationName: "Convertix",
  keywords: ["file converter", "online file converter", "free file converter", "convert files online", "DOCX to PDF", "document converter", "image converter", "file format guides"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", url: "/", siteName: "Convertix", title: "Convertix | Free Online File Converter", description: "Choose a file, select an output format, and download the converted file." },
  twitter: { card: "summary_large_image", title: "Convertix | Free Online File Converter", description: "Choose a file, select an output format, and download the converted file." },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Convertix",
    url: siteUrl,
    description: "Free online file conversion tools and practical file format guides.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#web-application`,
    name: "Convertix",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: "Choose a file, select an output format, and download the converted file with Convertix.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <SiteFooter />
        <AnalyticsConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
