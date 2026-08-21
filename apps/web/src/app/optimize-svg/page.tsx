import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SvgOptimizer } from "@/components/svg-optimizer";

export const metadata: Metadata = {
  title: "Optimize SVG Online",
  description:
    "Optimize an SVG in your browser, compare both renders, and download the result after it passes a visual check.",
  alternates: {
    canonical: "/optimize-svg",
  },
  openGraph: {
    type: "website",
    url: "/optimize-svg",
    title: "Optimize SVG Online — Convertix",
    description:
      "Reduce an SVG in your browser and compare the original and optimized renders before downloading.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Optimize SVG Online — Convertix",
    description: "Reduce an SVG in your browser and compare both renders before downloading.",
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
