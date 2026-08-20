import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { FormatMark } from "@/components/format-mark";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "File Format Guides",
  description:
    "Practical Convertix guides to file formats, quality, compatibility, and choosing the right conversion route.",
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    title: "DOCX or PDF: which should you send?",
    body: "Use DOCX when someone still needs to edit the document. Use PDF when layout consistency matters more than easy editing.",
    href: "/docx-to-pdf",
    source: "docx" as const,
    target: "pdf" as const,
  },
  {
    title: "PNG, JPG or WebP for web images?",
    body: "PNG is strong for transparency and crisp UI graphics, JPG suits photographs, and WebP often balances quality with smaller files.",
    href: "/png-to-webp",
    source: "png" as const,
    target: "webp" as const,
  },
  {
    title: "MP3 or WAV for audio?",
    body: "WAV preserves uncompressed audio for editing. MP3 is much smaller and more convenient when sharing or listening is the priority.",
    href: "/wav-to-mp3",
    source: "wav" as const,
    target: "mp3" as const,
  },
  {
    title: "Why spreadsheets look different as PDFs",
    body: "Spreadsheet print areas, scaling, page breaks, fonts and hidden rows can all affect the final PDF. Previewing layout first avoids surprises.",
    href: "/xlsx-to-pdf",
    source: "xlsx" as const,
    target: "pdf" as const,
  },
  {
    title: "When SVG beats a raster image",
    body: "SVG stays sharp at any size and is ideal for many logos and icons. Raster formats are usually a better fit for photographs and pixel-heavy artwork.",
    href: "/optimize-svg",
    source: "svg" as const,
    target: "png" as const,
  },
  {
    title: "What file conversion can change",
    body: "A conversion changes representation, not just the extension. Fonts, transparency, codecs, metadata and layout can all be affected depending on the route.",
    href: "/#formats",
    source: "pdf" as const,
    target: "png" as const,
  },
];

export default function GuidesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="guides-page">
        <header className="guides-hero">
          <span className="section-kicker">Convertix Guides</span>
          <h1>Choose the format before you choose the converter.</h1>
          <p>
            Short, practical explanations for the file decisions that usually come before a conversion. No filler, no invented benchmarks, and no pretending every format is interchangeable.
          </p>
        </header>

        <section className="guide-grid" aria-label="File format guides">
          {guides.map((guide) => (
            <Link className="guide-card" href={guide.href} key={guide.title}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }} aria-hidden="true">
                  <FormatMark format={guide.source} compact />
                  <ArrowIcon />
                  <FormatMark format={guide.target} compact />
                </div>
                <h2>{guide.title}</h2>
                <p>{guide.body}</p>
              </div>
              <footer>
                <span>Read the practical route</span>
                <ArrowIcon />
              </footer>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
