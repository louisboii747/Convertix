import type { Metadata } from "next";
import Link from "next/link";
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
};

export default function OptimizeSvgPage() {
  return (
    <main id="main-content">
      <div style={{ width: "min(1120px, calc(100% - 32px))", margin: "18px auto 0" }}>
        <Link href="/" style={{ color: "var(--cobalt)", fontWeight: 800 }}>
          ← Back to Convertix
        </Link>
      </div>
      <SvgOptimizer />
    </main>
  );
}
