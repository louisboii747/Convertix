import type { Metadata } from "next";

import { ImageCompressor } from "@/components/image-compressor";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Compress Images Online | JPG, PNG & WebP",
  description:
    "Compress JPG, PNG, and WebP images directly in your browser with Convertix. Reduce image file size and download the smaller result without uploading it.",
  alternates: {
    canonical: "/compress-image",
  },
  openGraph: {
    type: "website",
    url: "/compress-image",
    title: "Compress Images Online — Convertix",
    description:
      "Reduce JPG, PNG, and WebP file sizes directly in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress Images Online — Convertix",
    description:
      "Reduce JPG, PNG, and WebP file sizes directly in your browser.",
  },
};

export default function CompressImagePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <ImageCompressor />
      </main>
    </>
  );
}
