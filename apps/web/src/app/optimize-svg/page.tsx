import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SvgOptimizer } from "@/components/svg-optimizer";

export const metadata: Metadata = {
  title: "Optimize SVG Without Breaking It",
  description:
    "Optimize SVG files locally in your browser with Convertix. Compare the original and optimized render, verify visual appearance, and download only when the result passes verification.",
  alternates: {
    canonical: "/optimize-svg",
  },
  openGraph: {
    type: "website",
    url: "/optimize-svg",
    title: "Optimize SVG Without Breaking It — Convertix",
    description:
      "A safe SVG optimizer that runs locally, compares both renders, and blocks downloads when optimization changes the image.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Optimize SVG Without Breaking It — Convertix",
    description: "Optimize SVG locally, compare both renders, and download only when the result passes visual verification.",
  },
};

export default function OptimizeSvgPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <SvgOptimizer />
      </main>
    </>
  );
}
