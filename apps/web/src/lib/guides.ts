export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  updated: string;
  sections: GuideSection[];
  routes: { label: string; href: string }[];
  related: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "docx-vs-pdf",
    title: "DOCX vs PDF: which format should you use?",
    description: "Learn when DOCX is better for editing, when PDF is better for sharing, and how to choose the right document format.",
    eyebrow: "Documents",
    intro: "DOCX and PDF can contain the same words and images, but they solve different problems. DOCX is designed to stay editable. PDF is designed to keep a document looking consistent when it moves between devices and people.",
    updated: "2026-08-20",
    sections: [
      { heading: "Choose DOCX when the document is still changing", paragraphs: ["A DOCX file keeps the document in a form that word processors can edit. It is the better hand-off when another person needs to rewrite text, leave comments, change styles or continue working on the document."], bullets: ["Drafts and collaborative documents", "Assignments that must be submitted as editable Word files", "Templates and documents that will be reused"] },
      { heading: "Choose PDF when the layout is the result", paragraphs: ["PDF is usually the safer choice for a finished document. It is intended to preserve page layout, which makes it useful when margins, fonts, page breaks and positioning matter to the recipient."], bullets: ["CVs, invoices and finished reports", "Documents intended for printing", "Files being shared with someone who does not need to edit them"] },
      { heading: "What can change during DOCX to PDF conversion?", paragraphs: ["Conversion is more than changing a filename extension. Font availability, embedded objects, page sizing and application-specific layout behaviour can affect the result. For an important document, check the converted PDF before sending it." ] },
    ],
    routes: [{ label: "Convert DOCX to PDF", href: "/docx-to-pdf" }],
    related: ["png-jpg-or-webp", "file-conversion-explained"],
  },
  {
    slug: "png-jpg-or-webp",
    title: "PNG vs JPG vs WebP: which image format is best?",
    description: "Compare PNG, JPG and WebP for photos, transparency, web graphics, compatibility and file size.",
    eyebrow: "Images",
    intro: "There is no single best image format. PNG, JPG and WebP make different trade-offs between image quality, transparency, compatibility and file size. Picking the format around the job is usually better than converting everything to one type.",
    updated: "2026-08-20",
    sections: [
      { heading: "PNG: useful for transparency and crisp graphics", paragraphs: ["PNG uses lossless compression and supports transparency. It is a strong fit for screenshots, diagrams, interface graphics and images where sharp edges matter. Photographs stored as PNG can become unnecessarily large." ] },
      { heading: "JPG: a practical format for photographs", paragraphs: ["JPG uses lossy compression and is widely supported. It can make photographic images much smaller, but repeated editing and compression can introduce visible artefacts. JPG does not provide the alpha transparency commonly expected from PNG or WebP." ] },
      { heading: "WebP: built with the web in mind", paragraphs: ["WebP supports both lossy and lossless compression as well as transparency. For modern web projects it can often reduce transfer size while keeping useful image features, although your workflow or target software may still require PNG or JPG." ] },
      { heading: "A simple rule of thumb", paragraphs: ["Use PNG when lossless detail or transparency is the priority, JPG for broadly compatible photographic delivery, and WebP when optimising modern web images. Always judge the actual output rather than assuming a conversion will automatically make a file smaller." ] },
    ],
    routes: [{ label: "Convert PNG to WebP", href: "/png-to-webp" }, { label: "Convert WebP to PNG", href: "/webp-to-png" }, { label: "Convert PNG to JPG", href: "/png-to-jpg" }],
    related: ["docx-vs-pdf", "svg-vs-png", "file-conversion-explained"],
  },
  {
    slug: "mp3-vs-wav",
    title: "MP3 vs WAV: which audio format should you choose?",
    description: "Understand the difference between MP3 and WAV and choose the right format for editing, sharing and listening.",
    eyebrow: "Audio",
    intro: "WAV and MP3 are often used at different stages of an audio workflow. WAV commonly prioritises an uncompressed or lossless working representation, while MP3 prioritises compact files that are convenient to distribute and play.",
    updated: "2026-08-20",
    sections: [
      { heading: "WAV for production and editing", paragraphs: ["WAV is a container that is commonly used for uncompressed PCM audio. That makes it a predictable working format for recording and editing, at the cost of much larger files than compressed delivery formats." ] },
      { heading: "MP3 for convenient delivery", paragraphs: ["MP3 removes audio information to reduce file size. At sensible settings it is convenient for listening, sharing and devices where storage or bandwidth matters more than retaining a production master." ] },
      { heading: "Converting MP3 to WAV does not restore lost detail", paragraphs: ["Turning an MP3 into WAV can make it compatible with a WAV-based workflow, but it cannot recreate information discarded by the earlier lossy MP3 encoding. Keep an original high-quality source when quality matters." ] },
    ],
    routes: [{ label: "Convert WAV to MP3", href: "/wav-to-mp3" }, { label: "Convert MP3 to WAV", href: "/mp3-to-wav" }],
    related: ["mp4-vs-webm", "file-conversion-explained"],
  },
  {
    slug: "mp4-vs-webm",
    title: "MP4 vs WebM: which video format should you use?",
    description: "Compare MP4 and WebM for browser video, compatibility, codecs and everyday sharing.",
    eyebrow: "Video",
    intro: "MP4 and WebM are containers rather than a guarantee of one specific codec or quality level. The best choice depends on where the video needs to play and what codecs the target platform accepts.",
    updated: "2026-08-20",
    sections: [
      { heading: "MP4 is the compatibility-first choice", paragraphs: ["MP4 is supported across a very broad range of consumer software, devices and publishing workflows. When you need to send a video to someone without controlling their playback environment, MP4 is often the simpler choice." ] },
      { heading: "WebM is closely associated with web delivery", paragraphs: ["WebM was designed for media on the web and is supported by modern browsers. It can be useful for browser-first assets and workflows that specifically call for WebM-compatible codecs." ] },
      { heading: "Container is only part of the story", paragraphs: ["File size and visual quality depend heavily on codec, bitrate, resolution, frame rate and encoder settings. Converting MP4 to WebM does not guarantee a smaller video, and converting WebM to MP4 does not automatically improve compatibility with every application." ] },
    ],
    routes: [{ label: "Convert MP4 to WebM", href: "/mp4-to-webm" }, { label: "Convert WebM to MP4", href: "/webm-to-mp4" }],
    related: ["mp3-vs-wav", "file-conversion-explained"],
  },
  {
    slug: "svg-vs-png",
    title: "SVG vs PNG: when should you use each?",
    description: "Learn when scalable SVG graphics are a better fit than PNG and when raster images are the practical choice.",
    eyebrow: "Graphics",
    intro: "SVG describes graphics using vectors and document instructions, while PNG stores a grid of pixels. That difference matters when an image needs to scale, preserve transparency or represent detailed pixel-based artwork.",
    updated: "2026-08-20",
    sections: [
      { heading: "SVG stays sharp when it scales", paragraphs: ["Vector shapes can be redrawn at different sizes without the blockiness associated with enlarging a raster image. That makes SVG especially useful for logos, icons, diagrams and other shape-based graphics." ] },
      { heading: "PNG is predictable for pixel-based output", paragraphs: ["PNG is a lossless raster format with transparency support. It is useful when you need fixed pixel dimensions, compatibility with raster-only software, screenshots or graphics whose detail is fundamentally pixel based." ] },
      { heading: "Why convert SVG to PNG?", paragraphs: ["A PNG export can be useful when a destination does not accept SVG, when you need an exact raster size, or when you want to freeze the rendered appearance of a vector asset. Keep the original SVG if you may need to resize or edit the vector later." ] },
    ],
    routes: [{ label: "Convert SVG to PNG", href: "/svg-to-png" }, { label: "Optimise an SVG", href: "/optimize-svg" }],
    related: ["png-jpg-or-webp", "file-conversion-explained"],
  },
  {
    slug: "file-conversion-explained",
    title: "What actually happens when you convert a file?",
    description: "A practical explanation of file conversion, extensions, codecs, quality and why converted files can look or sound different.",
    eyebrow: "File basics",
    intro: "Changing a file extension and converting a file are not the same thing. A real conversion reads information in one representation and writes it into another, which can require decisions about features the destination format cannot represent in exactly the same way.",
    updated: "2026-08-20",
    sections: [
      { heading: "The extension is a label, not the contents", paragraphs: ["Renaming photo.png to photo.jpg does not perform a PNG-to-JPG conversion. Software still encounters PNG-encoded data inside the renamed file. A converter decodes the source and creates data that follows the destination format." ] },
      { heading: "Some conversions are lossy", paragraphs: ["A destination format may intentionally discard information to reduce size, or it may simply lack a feature available in the source. Examples can include image detail, audio information, transparency, editable document structure or metadata." ] },
      { heading: "Containers and codecs are different", paragraphs: ["Video and audio filenames can hide another layer of complexity. A container such as MP4 can carry streams encoded with different codecs, so two files with the same extension are not necessarily encoded the same way." ] },
      { heading: "Check important outputs", paragraphs: ["For important documents, media or production assets, inspect the converted result before deleting the source. Conversion is a transformation, and the correct output depends on what you need to preserve." ] },
    ],
    routes: [{ label: "Browse live conversion tools", href: "/tools" }],
    related: ["docx-vs-pdf", "png-jpg-or-webp", "mp3-vs-wav", "mp4-vs-webm", "svg-vs-png"],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug);
}
