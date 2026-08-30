import type { FormatId } from "@/lib/formats";

export interface FormatContent {
  summary: string;
  description: string;
  useCases: string[];
  strengths: string[];
  considerations: string[];
}

export const FORMAT_CONTENT: Partial<Record<FormatId, FormatContent>> = {
  pdf: {
    summary: "PDF is a document format designed to preserve page layout across devices, browsers and operating systems.",
    description: "PDF is commonly used for finished documents such as CVs, invoices, reports and forms because the visual layout is intended to stay consistent when the file is shared or printed.",
    useCases: ["Finished documents and reports", "CVs and applications", "Invoices, forms and printable files"],
    strengths: ["Consistent page layout", "Broad compatibility", "Well suited to sharing and printing"],
    considerations: ["Usually less convenient to edit than DOCX", "Embedded fonts and complex layouts can affect conversions", "A converted PDF should be checked before important use"],
  },
  docx: {
    summary: "DOCX is Microsoft Word's modern document format and is built around editable, structured documents.",
    description: "DOCX is useful while a document is still being written, reviewed or redesigned. It can retain headings, tables, images, comments and other word-processing structure.",
    useCases: ["Editable reports and assignments", "Collaborative documents", "Templates and reusable documents"],
    strengths: ["Designed for editing", "Rich document structure", "Widely supported by modern office software"],
    considerations: ["Layout can vary between applications", "Fonts may render differently on another device", "PDF is often a better final-delivery format"],
  },
  txt: {
    summary: "TXT stores plain text without document layout, embedded images or rich formatting.",
    description: "Plain text is lightweight and portable. It is useful when the words matter more than fonts, page layout or document styling.",
    useCases: ["Notes and simple text", "Logs and configuration snippets", "Moving text between applications"],
    strengths: ["Very small files", "Simple and broadly compatible", "Easy to process programmatically"],
    considerations: ["No rich formatting", "No images or page layout", "Character encoding can matter for unusual text"],
  },
  xlsx: {
    summary: "XLSX is the modern Excel workbook format for spreadsheets, formulas, tables and structured worksheet data.",
    description: "XLSX is useful when spreadsheet data needs to remain interactive and editable. Converting it to a fixed-layout format can be useful when the workbook needs to be shared as a report.",
    useCases: ["Spreadsheets and calculations", "Tables and reports", "Data that needs formulas or multiple sheets"],
    strengths: ["Editable cells and formulas", "Multiple worksheets", "Rich spreadsheet features"],
    considerations: ["Wide sheets can be difficult to fit onto pages", "Charts and print areas affect PDF output", "Interactive spreadsheet features do not remain interactive in PDF"],
  },
  png: {
    summary: "PNG is a lossless raster image format commonly used for screenshots, graphics and images that need transparency.",
    description: "PNG keeps exact pixel information rather than using photographic lossy compression. That makes it a strong fit for sharp interface graphics, diagrams and transparent assets.",
    useCases: ["Screenshots", "Transparent graphics", "UI assets and diagrams"],
    strengths: ["Lossless image storage", "Alpha transparency", "Sharp edges and text"],
    considerations: ["Photographs can be much larger than JPG or WebP", "Raster images do not scale infinitely", "Converting to JPG removes transparency"],
  },
  jpg: {
    summary: "JPG is a widely supported lossy image format designed to store photographs efficiently.",
    description: "JPG trades some image information for smaller files, making it practical for photos, uploads and broad compatibility where transparency is not required.",
    useCases: ["Photographs", "Social and web uploads", "Broadly compatible image sharing"],
    strengths: ["Small photographic files", "Very broad support", "Good fit for continuous-tone imagery"],
    considerations: ["No alpha transparency", "Repeated lossy saves can reduce quality", "Flat graphics and text may show compression artefacts"],
  },
  webp: {
    summary: "WebP supports lossy and lossless compression, transparency, and broad browser compatibility.",
    description: "WebP is often useful for websites because it can provide smaller image transfers while retaining features such as transparency. Modern browsers support it broadly.",
    useCases: ["Website images", "Optimised web graphics", "Transparent web assets"],
    strengths: ["Efficient compression", "Transparency support", "Lossy and lossless modes"],
    considerations: ["Some older or specialist software may prefer PNG or JPG", "Smaller output is not guaranteed for every image", "Quality depends on encoder settings"],
  },
  heic: {
    summary: "HEIC is an efficient image container commonly used by iPhones and other Apple devices for photographs.",
    description: "HEIC usually stores images encoded with HEVC, often at smaller sizes than JPEG while retaining useful camera metadata and image quality.",
    useCases: ["iPhone and iPad photos", "Efficient photo storage", "Modern camera workflows"],
    strengths: ["Efficient photographic compression", "Can retain EXIF metadata", "Supports transparency and high bit-depth imagery"],
    considerations: ["Some apps still require JPG or PNG", "Orientation metadata must be handled during conversion", "Compatibility varies outside newer devices and software"],
  },
  heif: {
    summary: "HEIF is a modern container format for efficiently storing high-quality images and image sequences.",
    description: "HEIF can hold images encoded with HEVC and related metadata. HEIC is a commonly encountered HEIF-based form used by Apple devices.",
    useCases: ["Modern phone photography", "Efficient image archives", "Images with metadata or transparency"],
    strengths: ["Efficient storage", "Flexible image container", "Supports metadata and alpha channels"],
    considerations: ["Older software may not open it", "Decoder support is required", "JPG, PNG or WebP may be easier to share"],
  },
  svg: {
    summary: "SVG is a vector graphics format that describes shapes, paths and text rather than storing a fixed grid of pixels.",
    description: "SVG is especially useful for logos, icons and diagrams that need to stay sharp at different sizes. It can also contain markup and styling that should be handled carefully when SVG files come from untrusted sources.",
    useCases: ["Logos and icons", "Scalable diagrams", "Web interface graphics"],
    strengths: ["Scales without raster blur", "Editable vector structure", "Often compact for shape-based graphics"],
    considerations: ["Not ideal for photographic imagery", "Rendering can vary with fonts and external resources", "Raster export is needed for software that does not accept SVG"],
  },
  mp3: {
    summary: "MP3 is a lossy audio format designed to make audio files substantially smaller for listening and distribution.",
    description: "MP3 remains widely compatible and convenient for playback. It is normally a delivery format rather than the best choice for preserving a production master.",
    useCases: ["Music and spoken audio", "Portable listening", "Sharing smaller audio files"],
    strengths: ["Broad playback support", "Compact files", "Useful for distribution"],
    considerations: ["Lossy compression discards information", "Converting MP3 to WAV cannot restore lost detail", "Production workflows often prefer a lossless source"],
  },
  wav: {
    summary: "WAV is an audio container commonly used for uncompressed PCM audio in recording and production workflows.",
    description: "WAV files are typically much larger than MP3 files, but they are useful when editing or processing audio without adding another stage of lossy compression.",
    useCases: ["Recording and editing", "Production masters", "Audio workflows that expect PCM"],
    strengths: ["Predictable production format", "Commonly lossless or uncompressed", "Widely supported by audio software"],
    considerations: ["Large file sizes", "Not automatically higher quality than the original source", "Converting a lossy source to WAV does not recreate missing information"],
  },
  mp4: {
    summary: "MP4 is a widely supported multimedia container commonly used for video on phones, computers and the web.",
    description: "MP4 can carry different video and audio codecs, so the extension alone does not define the exact compression, quality or compatibility of the streams inside it.",
    useCases: ["General video sharing", "Phone and desktop playback", "Web and social video"],
    strengths: ["Very broad compatibility", "Supports modern compressed media", "Common across consumer devices"],
    considerations: ["Codec support still matters", "File size depends on bitrate and encoding settings", "Converting containers can require transcoding"],
  },
  webm: {
    summary: "WebM is a multimedia container used for video and audio on the web.",
    description: "WebM is closely associated with modern web playback. It can be a good fit for browser-first assets when the target environment supports the codecs used inside the file.",
    useCases: ["Browser video", "Web-first media", "Sites using WebM-compatible codecs"],
    strengths: ["Designed for web delivery", "Supported by modern browsers", "Works with modern open codecs"],
    considerations: ["Some editing and consumer applications prefer MP4", "The container does not determine quality on its own", "Compatibility depends on the codecs inside the file"],
  },
};

export function getFormatContent(format: FormatId) {
  return FORMAT_CONTENT[format];
}
