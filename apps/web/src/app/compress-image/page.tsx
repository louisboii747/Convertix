import type { Metadata } from "next";

import { ImageCompressor } from "@/components/image-compressor";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Batch Image Compressor | Compress JPG, PNG & WebP",
  description:
    "Compress up to 30 JPG, PNG, and WebP images at once directly in your browser. Download results individually or together as a ZIP without uploading them.",
  alternates: {
    canonical: "/compress-image",
  },
  openGraph: {
    type: "website",
    url: "/compress-image",
    title: "Batch Image Compressor — Convertix",
    description:
      "Compress multiple JPG, PNG, and WebP images together directly in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Batch Image Compressor — Convertix",
    description:
      "Compress multiple JPG, PNG, and WebP images together directly in your browser.",
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
