import type { Metadata } from "next";

import { PdfCompressor } from "@/components/pdf-compressor";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Compress PDF Online",
  description:
    "Compress PDF files with Convertix. Choose a compression level, reduce file size, compare the result, and download the optimized PDF.",
  alternates: {
    canonical: "/compress-pdf",
  },
  openGraph: {
    type: "website",
    url: "/compress-pdf",
    title: "Compress PDF Online — Convertix",
    description:
      "Reduce PDF file size with adjustable compression levels and clear before-and-after size comparison.",
  },
};

export default function CompressPdfPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <PdfCompressor />
      </main>
    </>
  );
}
