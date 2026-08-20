export interface ConversionContent {
  intro: string;
  highlights: readonly {
    heading: string;
    body: string;
  }[];
  faq: readonly {
    question: string;
    answer: string;
  }[];
}

export const CONVERSION_CONTENT: Readonly<Record<string, ConversionContent>> = {
  "docx-to-pdf": {
    intro:
      "DOCX is built for editing, while PDF is designed to keep a document's layout consistent when it is shared or printed.",
    highlights: [
      {
        heading: "Why convert DOCX to PDF?",
        body: "PDF is a better fit when the document is finished and you want a fixed-layout version that is easier to share, print, or submit.",
      },
      {
        heading: "What can change?",
        body: "Fonts, spacing, page breaks, and embedded content can shift during conversion if the source document relies on features or fonts the converter cannot reproduce exactly.",
      },
      {
        heading: "When should I keep DOCX?",
        body: "Keep the DOCX version when the document still needs editing, comments, tracked changes, or other Word-specific features.",
      },
    ],
    faq: [
      {
        question: "Will DOCX formatting stay the same in PDF?",
        answer:
          "Usually the goal is to preserve the page layout, but fonts, spacing, page breaks, and advanced Word features can still render differently after conversion.",
      },
      {
        question: "Why use PDF instead of DOCX for sharing?",
        answer:
          "PDF is useful when you want a fixed-layout document that recipients can open without needing to edit the original Word file.",
      },
    ],
  },
  "txt-to-pdf": {
    intro:
      "TXT stores plain text with almost no layout information. PDF turns that content into fixed pages that are easier to print or distribute consistently.",
    highlights: [
      {
        heading: "Why convert TXT to PDF?",
        body: "PDF gives plain text a fixed page layout, making it more practical for printing, archiving, or sharing as a finished document.",
      },
      {
        heading: "What does TXT not contain?",
        body: "Plain-text files do not store rich formatting such as fonts, images, tables, or page layout in the way DOCX or PDF files do.",
      },
      {
        heading: "When should I keep TXT?",
        body: "TXT remains useful when you need a lightweight, editable, software-friendly file with no dependence on document formatting.",
      },
    ],
    faq: [
      {
        question: "Does converting TXT to PDF add formatting?",
        answer:
          "It adds a fixed document layout around the text, but it cannot recover rich formatting that was never stored in the TXT file.",
      },
      {
        question: "Is PDF better than TXT for printing?",
        answer:
          "PDF is usually better when you need predictable page boundaries and layout, while TXT is better for simple editable text.",
      },
    ],
  },
  "txt-to-docx": {
    intro:
      "Converting TXT to DOCX puts plain text into an editable Word document so you can add richer formatting afterwards.",
    highlights: [
      {
        heading: "Why convert TXT to DOCX?",
        body: "DOCX gives you access to headings, fonts, lists, tables, comments, and other document features that plain text cannot store.",
      },
      {
        heading: "What carries across?",
        body: "The text itself can carry across, but rich formatting cannot be recreated automatically if it was never present in the TXT source.",
      },
      {
        heading: "When should I keep TXT?",
        body: "Keep TXT when compatibility, simplicity, and easy machine processing matter more than document styling.",
      },
    ],
    faq: [
      {
        question: "Will TXT to DOCX restore lost formatting?",
        answer:
          "No. A plain-text file does not contain the original fonts, images, tables, or styling, so those details cannot be reconstructed from TXT alone.",
      },
      {
        question: "Why use DOCX instead of TXT?",
        answer:
          "DOCX is better when you want to format, edit, review, or present the text as a conventional document.",
      },
    ],
  },
  "xlsx-to-pdf": {
    intro:
      "XLSX is an editable spreadsheet format. PDF is useful when you want a fixed snapshot of a workbook for sharing, review, or printing.",
    highlights: [
      {
        heading: "Why convert XLSX to PDF?",
        body: "A PDF can present spreadsheet content without exposing formulas or requiring the recipient to open an editable workbook.",
      },
      {
        heading: "What can affect the result?",
        body: "Print areas, page orientation, column widths, hidden sheets, charts, and page breaks can all influence how a spreadsheet appears as a PDF.",
      },
      {
        heading: "When should I keep XLSX?",
        body: "Keep XLSX when the recipient needs formulas, filters, editable cells, multiple working sheets, or spreadsheet-specific features.",
      },
    ],
    faq: [
      {
        question: "Will XLSX formulas still work in PDF?",
        answer:
          "No. A PDF is a fixed output format, so formulas are represented by their visible results rather than remaining editable spreadsheet formulas.",
      },
      {
        question: "Why can spreadsheet page breaks change in PDF?",
        answer:
          "Spreadsheet layout depends on print settings such as paper size, scaling, orientation, margins, and the selected print area.",
      },
    ],
  },
  "png-to-jpg": {
    intro:
      "PNG is lossless and can store transparency. JPG is usually a better fit for photographs and smaller image files where transparency is not required.",
    highlights: [
      {
        heading: "Why convert PNG to JPG?",
        body: "JPG is widely supported and often produces smaller files for photographs or images with lots of colour variation.",
      },
      {
        heading: "What happens to transparency?",
        body: "JPEG does not support transparency. If your PNG contains transparent areas, check the converted image to make sure the flattened background is suitable.",
      },
      {
        heading: "Will quality change?",
        body: "JPEG uses lossy compression, so converting from PNG can discard some image detail depending on the encoding settings used for the output.",
      },
    ],
    faq: [
      {
        question: "Does converting PNG to JPG reduce quality?",
        answer:
          "It can. PNG is lossless, while JPEG normally uses lossy compression, so some detail may be discarded during encoding.",
      },
      {
        question: "Can JPG keep a transparent PNG background?",
        answer:
          "No. JPEG does not support transparency, so transparent pixels must be flattened into an opaque result.",
      },
    ],
  },
  "png-to-webp": {
    intro:
      "WebP is a modern web image format that can support both transparency and efficient compression, making it a useful alternative to PNG for many web assets.",
    highlights: [
      {
        heading: "Why convert PNG to WebP?",
        body: "WebP can reduce image size while still supporting transparency, which can be useful for websites and web applications.",
      },
      {
        heading: "Does WebP support transparency?",
        body: "Yes. WebP can store an alpha channel, so transparent PNG graphics can remain transparent when the output is encoded appropriately.",
      },
      {
        heading: "When should I keep PNG?",
        body: "PNG is still a strong choice for lossless graphics, broad tooling compatibility, and workflows that specifically expect PNG files.",
      },
    ],
    faq: [
      {
        question: "Is WebP always smaller than PNG?",
        answer:
          "Not always. File size depends on image content and encoding settings, although WebP often compresses web graphics efficiently.",
      },
      {
        question: "Can WebP preserve PNG transparency?",
        answer:
          "Yes, WebP supports transparency, provided the output is encoded with alpha information intact.",
      },
    ],
  },
  "jpg-to-png": {
    intro:
      "PNG uses lossless compression and is well suited to graphics, screenshots, and images that need transparency. Converting a JPG to PNG changes the container, but it cannot restore image detail already lost to JPEG compression.",
    highlights: [
      {
        heading: "Why convert JPG to PNG?",
        body: "PNG can be useful when a workflow requires PNG specifically or when you want future edits and saves to avoid introducing additional JPEG compression.",
      },
      {
        heading: "Does PNG improve old JPG quality?",
        body: "No. Converting to a lossless format stops new JPEG compression from being introduced by that conversion, but it cannot recreate detail already removed from the JPG.",
      },
      {
        heading: "Will the file get larger?",
        body: "It often can, especially for photographs, because PNG is lossless and is not usually as storage-efficient as JPEG for photographic content.",
      },
    ],
    faq: [
      {
        question: "Does JPG to PNG make an image higher quality?",
        answer:
          "No. The PNG can preserve the pixels it receives without further lossy compression, but it cannot recover information already lost in the JPG.",
      },
      {
        question: "Why can a PNG be larger than the JPG?",
        answer:
          "PNG uses lossless compression, while JPEG is designed to compress photographic images more aggressively by discarding some detail.",
      },
    ],
  },
  "jpg-to-webp": {
    intro:
      "WebP is designed for efficient web delivery and can be a practical replacement for JPG when you want a modern image format with flexible compression options.",
    highlights: [
      {
        heading: "Why convert JPG to WebP?",
        body: "WebP can offer efficient compression for web images and is widely supported by modern browsers.",
      },
      {
        heading: "Does conversion restore JPG detail?",
        body: "No. Any detail already lost when the source JPG was encoded cannot be recovered simply by converting it to another format.",
      },
      {
        heading: "When should I keep JPG?",
        body: "JPG remains useful when compatibility with older software, devices, or established image workflows matters most.",
      },
    ],
    faq: [
      {
        question: "Is WebP better than JPG for websites?",
        answer:
          "WebP is often a strong web choice because it supports efficient compression, but the best format still depends on image content and compatibility requirements.",
      },
      {
        question: "Will JPG to WebP improve image quality?",
        answer:
          "No. Conversion can change compression and file size, but it cannot restore detail that was already discarded from the JPG source.",
      },
    ],
  },
  "webp-to-png": {
    intro:
      "PNG is a broadly supported lossless image format. Converting WebP to PNG can be useful when an editor, service, or workflow does not accept WebP.",
    highlights: [
      {
        heading: "Why convert WebP to PNG?",
        body: "PNG is useful for compatibility with image editors and workflows that require a conventional lossless raster format.",
      },
      {
        heading: "Can transparency be preserved?",
        body: "Both WebP and PNG can store transparency, so alpha information can be represented in the PNG output when it exists in the source.",
      },
      {
        heading: "Will the file be larger?",
        body: "It can be. PNG is lossless and may produce a larger file than a compressed WebP version of the same image.",
      },
    ],
    faq: [
      {
        question: "Does WebP to PNG preserve transparency?",
        answer:
          "It can. Both formats support transparency, so transparent pixels can be represented in the PNG result.",
      },
      {
        question: "Why is my PNG larger than the WebP?",
        answer:
          "PNG uses lossless compression, while WebP can use more space-efficient compression depending on how the source was encoded.",
      },
    ],
  },
  "webp-to-jpg": {
    intro:
      "JPG remains one of the most widely accepted image formats. Converting WebP to JPG is useful when compatibility matters more than WebP-specific features such as transparency.",
    highlights: [
      {
        heading: "Why convert WebP to JPG?",
        body: "JPG works with a very broad range of software, devices, upload forms, and older image workflows.",
      },
      {
        heading: "What happens to transparency?",
        body: "JPEG does not support transparency, so any transparent areas in the WebP must become opaque in the output.",
      },
      {
        heading: "Can quality change?",
        body: "Yes. Re-encoding into JPEG can introduce another lossy compression step, so the output may differ slightly from the source.",
      },
    ],
    faq: [
      {
        question: "Can JPG preserve WebP transparency?",
        answer:
          "No. JPEG has no transparency channel, so transparent areas cannot remain transparent in the JPG result.",
      },
      {
        question: "Does WebP to JPG lose quality?",
        answer:
          "It can, because JPEG normally uses lossy compression and conversion requires the image to be encoded again.",
      },
    ],
  },
  "svg-to-png": {
    intro:
      "SVG stores vector shapes that can scale without becoming pixelated. PNG is a raster image, so converting SVG to PNG creates a fixed-resolution bitmap.",
    highlights: [
      {
        heading: "Why convert SVG to PNG?",
        body: "PNG is useful when an app, upload form, or publishing workflow expects a raster image instead of vector artwork.",
      },
      {
        heading: "Will it still scale infinitely?",
        body: "No. Once an SVG is rasterised into PNG, the result has a fixed pixel resolution and can become blurry when enlarged beyond that size.",
      },
      {
        heading: "Can PNG keep transparency?",
        body: "Yes. PNG supports transparency, making it a good raster target for logos, icons, and graphics with transparent backgrounds.",
      },
    ],
    faq: [
      {
        question: "Does SVG to PNG lose scalability?",
        answer:
          "Yes. SVG is vector-based, while PNG is made from pixels, so the PNG output has a fixed resolution.",
      },
      {
        question: "Can SVG to PNG keep a transparent background?",
        answer:
          "PNG supports transparency, so transparent parts of an SVG can be represented in the raster output.",
      },
    ],
  },
  "svg-to-jpg": {
    intro:
      "Converting SVG to JPG rasterises vector artwork into a fixed-resolution image and removes any transparency because JPEG only stores opaque pixels.",
    highlights: [
      {
        heading: "Why convert SVG to JPG?",
        body: "JPG can be useful when you need a widely supported raster image and transparency is not required.",
      },
      {
        heading: "What happens to scalability?",
        body: "The vector source becomes a fixed-size bitmap, so enlarging the JPG beyond its output resolution can make edges look soft or pixelated.",
      },
      {
        heading: "What happens to transparency?",
        body: "JPEG cannot store transparent pixels, so transparent SVG regions must be flattened into an opaque result.",
      },
    ],
    faq: [
      {
        question: "Does SVG to JPG keep transparency?",
        answer:
          "No. JPEG does not support transparency, so transparent areas cannot remain transparent in the final JPG.",
      },
      {
        question: "Will an SVG stay sharp after converting to JPG?",
        answer:
          "Only at appropriate output sizes. The JPG is raster-based and no longer has the SVG's resolution-independent scaling.",
      },
    ],
  },
  "svg-to-webp": {
    intro:
      "SVG is vector-based, while WebP is raster-based. Converting to WebP creates a fixed-resolution image that can be efficient for web delivery.",
    highlights: [
      {
        heading: "Why convert SVG to WebP?",
        body: "WebP can be useful when a web platform expects raster images but you still want modern compression and optional transparency support.",
      },
      {
        heading: "Does WebP keep vector scaling?",
        body: "No. The SVG is rasterised during conversion, so the resulting WebP has a fixed pixel resolution.",
      },
      {
        heading: "Can WebP keep transparency?",
        body: "Yes. WebP supports transparency, so it can be a more suitable raster target than JPG for vector artwork with transparent regions.",
      },
    ],
    faq: [
      {
        question: "Does SVG to WebP lose scalability?",
        answer:
          "Yes. WebP is a raster format, so the converted image no longer scales independently of resolution like an SVG does.",
      },
      {
        question: "Can SVG to WebP preserve transparency?",
        answer:
          "Yes, WebP supports an alpha channel and can represent transparent areas from the SVG source.",
      },
    ],
  },
  "mp3-to-wav": {
    intro:
      "MP3 is a lossy compressed audio format. WAV is commonly used in editing and production workflows where a less compressed working format is preferred.",
    highlights: [
      {
        heading: "Why convert MP3 to WAV?",
        body: "WAV is widely used by audio editors, DAWs, and production tools, making it convenient when software expects a conventional waveform audio file.",
      },
      {
        heading: "Does WAV restore lost audio detail?",
        body: "No. Converting an MP3 to WAV cannot recreate frequencies or detail that were removed when the MP3 was originally compressed.",
      },
      {
        heading: "Will the file be larger?",
        body: "Usually yes. WAV files used for uncompressed PCM audio are typically much larger than MP3 files of the same duration.",
      },
    ],
    faq: [
      {
        question: "Does MP3 to WAV improve audio quality?",
        answer:
          "No. The WAV can avoid another lossy encoding step in later editing, but it cannot restore audio information already lost from the MP3.",
      },
      {
        question: "Why is WAV much larger than MP3?",
        answer:
          "MP3 uses lossy compression to reduce file size, while WAV is commonly used to store much less compressed or uncompressed audio data.",
      },
    ],
  },
  "wav-to-mp3": {
    intro:
      "MP3 uses lossy compression to make audio files much smaller than typical WAV files, which is useful for sharing, downloads, and portable playback.",
    highlights: [
      {
        heading: "Why convert WAV to MP3?",
        body: "MP3 is compact, widely supported, and practical when storage space or transfer size matters more than preserving every bit of the source audio.",
      },
      {
        heading: "Will quality change?",
        body: "Yes. MP3 is lossy, so encoding from WAV discards some audio information to reduce file size.",
      },
      {
        heading: "When should I keep WAV?",
        body: "Keep WAV for editing, mastering, archiving, or other workflows where you want to avoid an additional lossy compression step.",
      },
    ],
    faq: [
      {
        question: "Does WAV to MP3 reduce audio quality?",
        answer:
          "Yes. MP3 uses lossy compression, so some audio information is discarded in exchange for a much smaller file.",
      },
      {
        question: "Why use MP3 instead of WAV?",
        answer:
          "MP3 is usually far smaller and is broadly supported, making it convenient for sharing, streaming, and portable playback.",
      },
    ],
  },
  "mp4-to-webm": {
    intro:
      "MP4 and WebM are both video containers. WebM is strongly associated with web delivery, while MP4 remains extremely common across devices and editing tools.",
    highlights: [
      {
        heading: "Why convert MP4 to WebM?",
        body: "WebM can be useful for browser-based media workflows and websites that specifically target WebM-compatible video playback.",
      },
      {
        heading: "Does the codec matter?",
        body: "Yes. MP4 and WebM are containers, so compatibility and quality also depend on the video and audio codecs used inside them.",
      },
      {
        heading: "Can quality change?",
        body: "It can. If conversion requires re-encoding, the output quality and file size depend on the selected codecs and encoding settings.",
      },
    ],
    faq: [
      {
        question: "Is WebM the same thing as a video codec?",
        answer:
          "No. WebM is a container format that carries encoded video and audio streams; the codecs inside the file determine how those streams are compressed.",
      },
      {
        question: "Can MP4 to WebM change video quality?",
        answer:
          "Yes. If the media must be re-encoded, quality and file size can change depending on the output codec and settings.",
      },
    ],
  },
  "webm-to-mp4": {
    intro:
      "MP4 is one of the most broadly supported video containers. Converting WebM to MP4 can help when a device, editor, social platform, or upload workflow does not accept WebM.",
    highlights: [
      {
        heading: "Why convert WebM to MP4?",
        body: "MP4 has extremely broad support across phones, televisions, editing software, browsers, and media-sharing platforms.",
      },
      {
        heading: "Does changing the container guarantee compatibility?",
        body: "Not always. Playback also depends on the video and audio codecs inside the MP4 file, not just the .mp4 extension.",
      },
      {
        heading: "Can quality change?",
        body: "Yes. If the conversion re-encodes the media streams rather than only changing the container, output quality and size can change.",
      },
    ],
    faq: [
      {
        question: "Why is MP4 more compatible than WebM in some apps?",
        answer:
          "MP4 is supported by a very broad range of consumer devices, editors, and upload platforms, while some workflows still do not accept WebM.",
      },
      {
        question: "Does WebM to MP4 always re-encode the video?",
        answer:
          "Not necessarily in general, but whether re-encoding is required depends on the codecs in the source and what the target MP4 workflow supports.",
      },
    ],
  },
};

export function getConversionContent(slug: string): ConversionContent | null {
  return CONVERSION_CONTENT[slug] ?? null;
}
