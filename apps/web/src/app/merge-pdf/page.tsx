import type { Metadata } from "next";

import { PdfMerger } from "@/components/pdf-merger";
import { requireAccount } from "@/lib/account-server";

export const metadata: Metadata = {
  title: "Merge PDF Online",
  description:
    "Merge PDF files with Convertix. Add multiple PDFs, reorder them, combine them into one document, and download the result.",
  alternates: {
    canonical: "/merge-pdf",
  },
  openGraph: {
    type: "website",
    url: "/merge-pdf",
    title: "Merge PDF Online — Convertix",
    description:
      "Combine multiple PDFs into one file and drag them into the order you need.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merge PDF Online — Convertix",
    description:
      "Combine multiple PDFs into one file and drag them into the order you need.",
  },
};

export default async function MergePdfPage() {
  await requireAccount();
  return (
    <>
      <main id="main-content">
        <PdfMerger />
      </main>
    </>
  );
}
