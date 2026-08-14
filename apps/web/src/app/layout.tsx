import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_CONVERTIX_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Convertix — Convert files without the fuss",
    template: "%s — Convertix",
  },
  description:
    "A simple, accessible file conversion experience with no account required for basic conversions.",
  applicationName: "Convertix",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Convertix — Convert files without the fuss",
    description:
      "Choose a file, select an available format, and follow one clear conversion route.",
    siteName: "Convertix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertix — Convert files without the fuss",
    description:
      "Choose a file, select an available format, and follow one clear conversion route.",
  },
};

const directionContract = `<!--
THESIS: A file converter is one clear route, not a marketing landing page; the task owns the first viewport.
OWN-WORLD: Mineral-white fields, deep-navy type, a cobalt route line and actions, and mint reserved for confirmed success; precise rules, flat surfaces, and 14–18px corners.
STORY: Select a file, understand its detected format, choose an enabled target, submit, and read one honest lifecycle.
FIRST VIEWPORT: Compact header and centered display headline above one wide continuous converter; file selection first, route steps next, full-width action, live status last.
FORM: Familiar consumer convention at full craft, approved Single Flow composition, seed key ea5e2193.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <div
          className="direction-contract"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: directionContract }}
        />
        <a className="skip-link" href="#main-content">
          Skip to converter
        </a>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
