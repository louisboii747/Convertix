import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SvgOptimizer } from "@/components/svg-optimizer";
import { FlowButton } from "@/components/ui/flow-button";

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
        <section
          className="guides-promo"
          aria-labelledby="svg-raster-conversion-title"
        >
          <div>
            <h2 id="svg-raster-conversion-title">Need a raster image instead?</h2>
            <p>
              Convert SVG to WebP when you need a fixed-resolution image for a
              website, app, upload, or raster-only workflow.
            </p>
          </div>
          <FlowButton
            href="/svg-to-webp"
            variant="dark"
            shape="rounded"
            text="Convert SVG to WebP"
          />
        </section>
      </main>
    </>
  );
}
