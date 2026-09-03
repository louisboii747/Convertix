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
  resources?: { label: string; href: string }[];
  related: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "docx-vs-pdf",
    title: "DOCX vs PDF: which format should you use?",
    description:
      "Learn when DOCX is better for editing, when PDF is better for sharing, and how to choose the right document format.",
    eyebrow: "Documents",
    intro:
      "DOCX and PDF can contain the same words and images, but they solve different problems. DOCX is designed to stay editable. PDF is designed to keep a document looking consistent when it moves between devices and people.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "Choose DOCX when the document is still changing",
        paragraphs: [
          "A DOCX file keeps the document in a form that word processors can edit. It is the better hand-off when another person needs to rewrite text, leave comments, change styles or continue working on the document.",
        ],
        bullets: [
          "Drafts and collaborative documents",
          "Assignments that must be submitted as editable Word files",
          "Templates and documents that will be reused",
        ],
      },
      {
        heading: "Choose PDF when the layout is the result",
        paragraphs: [
          "PDF is usually the safer choice for a finished document. It is intended to preserve page layout, which makes it useful when margins, fonts, page breaks and positioning matter to the recipient.",
        ],
        bullets: [
          "CVs, invoices and finished reports",
          "Documents intended for printing",
          "Files being shared with someone who does not need to edit them",
        ],
      },
      {
        heading: "What can change during DOCX to PDF conversion?",
        paragraphs: [
          "Conversion is more than changing a filename extension. Font availability, embedded objects, page sizing and application-specific layout behaviour can affect the result. For an important document, check the converted PDF before sending it.",
        ],
      },
    ],
    routes: [{ label: "Convert DOCX to PDF", href: "/docx-to-pdf" }],
    related: ["png-jpg-or-webp", "file-conversion-explained"],
  },
  {
    slug: "png-jpg-or-webp",
    title: "PNG vs JPG vs WebP: which image format is best?",
    description:
      "Compare PNG, JPG and WebP for photos, transparency, web graphics, compatibility and file size.",
    eyebrow: "Images",
    intro:
      "PNG, JPG and WebP make different trade-offs between image quality, transparency, compatibility and file size. The best choice depends on where the image will be used.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "PNG: useful for transparency and crisp graphics",
        paragraphs: [
          "PNG uses lossless compression and supports transparency. It is a strong fit for screenshots, diagrams, interface graphics and images where sharp edges matter. Photographs stored as PNG can become unnecessarily large.",
        ],
      },
      {
        heading: "JPG: a practical format for photographs",
        paragraphs: [
          "JPG uses lossy compression and is widely supported. It can make photographic images much smaller, but repeated editing and compression can introduce visible artefacts. JPG does not provide the alpha transparency commonly expected from PNG or WebP.",
        ],
      },
      {
        heading: "WebP: built with the web in mind",
        paragraphs: [
          "WebP supports both lossy and lossless compression as well as transparency. For modern web projects it can often reduce transfer size while keeping useful image features, although your workflow or target software may still require PNG or JPG.",
        ],
      },
      {
        heading: "A practical rule of thumb",
        paragraphs: [
          "Use PNG for lossless detail or transparency, JPG for photographs that need broad compatibility, and WebP for web images. Check the output because changing formats does not guarantee a smaller file.",
        ],
      },
    ],
    routes: [
      { label: "Convert PNG to WebP", href: "/png-to-webp" },
      { label: "Convert WebP to PNG", href: "/webp-to-png" },
      { label: "Convert PNG to JPG", href: "/png-to-jpg" },
    ],
    related: ["docx-vs-pdf", "svg-vs-png", "file-conversion-explained"],
  },

  {
    slug: "heic-vs-jpg",
    title: "HEIC vs JPG: which image format should you use?",
    description:
      "Compare HEIC and JPG for iPhone photos, compatibility, image quality, file size and everyday sharing.",
    eyebrow: "Images",
    intro:
      "HEIC and JPG are both common photo formats, but they prioritise different things. HEIC is designed for efficient modern image storage, while JPG remains one of the most widely compatible image formats across websites, apps and devices.",
    updated: "2026-08-30",
    sections: [
      {
        heading: "HEIC is designed for efficient photo storage",
        paragraphs: [
          "Apple devices commonly use HEIC as part of their High Efficiency camera setting. The format can store high-quality photographs efficiently, which makes it useful when you want to reduce storage without relying on the older JPEG format.",
          "If your devices and applications already support HEIC, there is often no need to convert a photo simply because of its file extension.",
        ],
      },
      {
        heading: "JPG is the compatibility-first choice",
        paragraphs: [
          "JPG has been supported for decades and works with an extremely broad range of websites, editors, messaging apps, document software and older devices.",
          "That makes JPG useful when an HEIC photo needs to be uploaded somewhere that does not accept HEIC, sent to someone using incompatible software, or opened in an older workflow.",
        ],
      },
      {
        heading: "Which format gives better image quality?",
        paragraphs: [
          "The file extension alone does not determine how good a photo looks. Image quality depends on the source image and the compression used when it was encoded.",
          "Converting an HEIC image to JPG does not improve the original photo. The HEIC image must be decoded and encoded again as JPEG, so the JPG is a new representation of the same image rather than a higher-quality copy.",
        ],
      },
      {
        heading: "HEIC and JPG make different file-size trade-offs",
        paragraphs: [
          "HEIC is intended to store images efficiently and can often achieve smaller files than older photo formats for comparable visual results. JPG also uses lossy compression, but its main advantage today is its near-universal compatibility rather than being the newest or most efficient format.",
          "The exact size difference depends on the photo and encoding settings, so converting HEIC to JPG does not guarantee that the resulting file will always be smaller.",
        ],
      },
      {
        heading: "Which should you use?",
        paragraphs: [
          "Keep HEIC when your devices and software support it and you want to retain the original iPhone photo. Convert to JPG when compatibility is more important and the image needs to work reliably with a wider range of software or upload forms.",
        ],
        bullets: [
          "Keep HEIC for supported Apple and modern photo workflows",
          "Choose JPG for broad compatibility and everyday sharing",
          "Keep the original HEIC if the photo matters to you",
          "Use PNG instead when lossless output or transparency is more important than photographic file size",
        ],
      },
    ],
    routes: [
      {
        label: "Convert HEIC to JPG",
        href: "/heic-to-jpg",
      },
      {
        label: "Convert HEIC to PNG",
        href: "/heic-to-png",
      },
      {
        label: "Convert HEIC to WebP",
        href: "/heic-to-webp",
      },
    ],
    resources: [
      {
        label: "Learn about the HEIC format",
        href: "/formats/heic",
      },
    ],
    related: [
      "why-iphone-uses-heic",
      "heic-vs-png",
      "open-heic-on-windows",
      "png-jpg-or-webp",
      "file-conversion-explained",
    ],
  },
  {
    slug: "open-heic-on-windows",
    title: "How to open HEIC files on Windows",
    description:
      "Learn how to open HEIC photos on Windows, why some PCs need extra image support, and when converting HEIC to JPG is the simpler option.",
    eyebrow: "Images",
    intro:
      "HEIC photos are common on iPhones, but Windows support can vary depending on the apps and media components installed on your PC. If a HEIC image will not open normally, there are several practical ways to view or convert it.",
    updated: "2026-08-30",
    sections: [
      {
        heading: "First, try opening the HEIC file in Windows Photos",
        paragraphs: [
          "On a Windows PC with the necessary image support installed, HEIC files can open in the Photos app like other images.",
          "If Windows says that an extension or codec is required, the file itself may be fine. The PC may simply be missing support for the HEIF or HEVC technology used by the image.",
        ],
      },
      {
        heading: "Windows may need HEIF or HEVC support",
        paragraphs: [
          "Microsoft provides HEIF Image Extensions for Windows and notes that some HEIF and HEVC media may also require HEVC support.",
          "After installing the required components, close and reopen the Photos app before trying the image again.",
        ],
        bullets: [
          "Open Microsoft Store",
          "Search for HEIF Image Extensions",
          "Install the required image support",
          "Restart Photos and try the HEIC file again",
        ],
      },
      {
        heading: "You can also view HEIC photos through OneDrive",
        paragraphs: [
          "Microsoft says HEIF photos stored in OneDrive can be previewed through the OneDrive website even when the local Windows computer does not have everything needed to open the file directly.",
          "This can be useful if you only need to inspect the photo and do not want to change its format.",
        ],
      },
      {
        heading: "Convert HEIC to JPG when compatibility matters",
        paragraphs: [
          "If the photo needs to work with a website, application or older program that does not support HEIC, converting it to JPG is often the simplest solution.",
          "JPG is supported by a much wider range of software. Keep the original HEIC as well if the image is important, because conversion creates a new encoded version rather than replacing the source format without change.",
        ],
      },
      {
        heading: "You can make future iPhone photos more compatible",
        paragraphs: [
          "Apple provides a Most Compatible camera setting on supported iPhones. When available, this causes new photos to be captured as JPEG instead of using the High Efficiency format.",
          "On iPhone, open Settings, choose Camera, then Formats and select Most Compatible if you prefer compatibility over HEIC storage efficiency.",
        ],
      },
    ],
    routes: [
      {
        label: "Convert HEIC to JPG",
        href: "/heic-to-jpg",
      },
      {
        label: "Convert HEIC to PNG",
        href: "/heic-to-png",
      },
    ],
    resources: [
      {
        label: "Learn about the HEIC format",
        href: "/formats/heic",
      },
    ],
    related: [
      "heic-vs-jpg",
      "why-iphone-uses-heic",
      "heic-vs-png",
      "png-jpg-or-webp",
      "file-conversion-explained",
    ],
  },

  {
    slug: "why-iphone-uses-heic",
    title: "Why do iPhones use HEIC for photos?",
    description:
      "Learn why iPhones save photos as HEIC, how High Efficiency mode reduces storage use, and when JPEG may be the better choice.",
    eyebrow: "Images",
    intro:
      "Modern iPhones commonly save photos using HEIC because it can store high-quality images more efficiently than older JPEG workflows. That saves space on the device and in photo libraries, although compatibility can still be a reason to use JPG instead.",
    updated: "2026-08-30",
    sections: [
      {
        heading: "HEIC is part of Apple's High Efficiency camera mode",
        paragraphs: [
          "Apple introduced support for HEIF images with iOS 11. On supported iPhones, the Camera app can use the High Efficiency setting to capture photos in HEIF-based formats such as HEIC.",
          "The goal is not simply to use a newer file extension. HEIF was designed to store image data more efficiently than older formats such as JPEG.",
        ],
      },
      {
        heading: "The main advantage is more efficient storage",
        paragraphs: [
          "Apple says HEIF provides better compression than JPEG while preserving the same visual quality. In practice, that can mean photos use less storage on your iPhone and in iCloud Photos than comparable images stored using older formats.",
          "This matters because a photo library can contain thousands of images. Saving space on each individual image can add up across an entire library.",
        ],
      },
      {
        heading: "HEIC can support more modern image features",
        paragraphs: [
          "HEIF is a modern image-container format rather than just a replacement filename for JPEG. It can support features and metadata used by modern photography workflows while still storing images efficiently.",
          "The exact information inside an HEIC file depends on how the image was captured and processed, so not every HEIC photo contains the same features.",
        ],
      },
      {
        heading: "Why does Apple still offer JPEG?",
        paragraphs: [
          "Compatibility remains JPEG's biggest advantage. HEIC support is now common on modern devices, but some websites, older applications and operating systems still expect JPG files.",
          "For this reason Apple provides a Most Compatible camera setting. On supported devices, choosing it causes new photos to be captured as JPEG instead of using the High Efficiency HEIF format.",
        ],
      },
      {
        heading: "Should you change your iPhone to Most Compatible?",
        paragraphs: [
          "If all of your devices and apps handle HEIC correctly, High Efficiency is usually the more storage-efficient option. You do not need to change the setting simply because your photos use the HEIC extension.",
          "Most Compatible can make sense if you regularly move photos into older Windows software, upload them to services that reject HEIC, or share files with people whose devices cannot open them.",
        ],
        bullets: [
          "Use High Efficiency when your workflow supports HEIC",
          "Use Most Compatible when JPEG support is more important",
          "You can convert individual HEIC photos instead of changing your camera setting",
          "Keep original photos when quality or metadata matters",
        ],
      },
    ],
    routes: [
      {
        label: "Convert HEIC to JPG",
        href: "/heic-to-jpg",
      },
      {
        label: "Convert HEIC to PNG",
        href: "/heic-to-png",
      },
      {
        label: "Convert HEIC to WebP",
        href: "/heic-to-webp",
      },
    ],
    resources: [
      {
        label: "Learn about the HEIC format",
        href: "/formats/heic",
      },
    ],
    related: [
      "heic-vs-jpg",
      "heic-vs-png",
      "open-heic-on-windows",
      "png-jpg-or-webp",
    ],
  },

  {
    slug: "heic-vs-png",
    title: "HEIC vs PNG: which format should you use?",
    description:
      "Compare HEIC and PNG for photos, editing, transparency, image quality, compatibility and file size.",
    eyebrow: "Images",
    intro:
      "HEIC and PNG can both store high-quality images, but they are designed for different jobs. HEIC is particularly useful for efficient photo storage, while PNG prioritises lossless image data, transparency and broad support in graphics workflows.",
    updated: "2026-08-30",
    sections: [
      {
        heading: "HEIC is usually better suited to photographs",
        paragraphs: [
          "HEIC is designed to store photographic images efficiently. It is commonly used by iPhones because it can keep photo files relatively compact while retaining strong visual quality.",
          "For a large photo library, that storage efficiency can make HEIC more practical than saving every photograph as PNG.",
        ],
      },
      {
        heading: "PNG uses lossless compression",
        paragraphs: [
          "PNG stores raster images using lossless compression. Saving an image as PNG does not introduce the kind of lossy compression associated with formats such as JPEG.",
          "That does not mean converting an HEIC photo to PNG restores information that was previously discarded. The PNG can only preserve the decoded image data it receives from the HEIC source.",
        ],
      },
      {
        heading: "PNG is useful for transparency and editing",
        paragraphs: [
          "PNG supports transparency and is widely used for screenshots, graphics, interface assets and images that may be edited repeatedly without introducing additional lossy compression.",
          "If transparency exists in the decoded HEIC image, PNG can represent that alpha information in the converted output.",
        ],
      },
      {
        heading: "Why can PNG files be much larger?",
        paragraphs: [
          "Lossless compression generally makes PNG less space-efficient than formats designed specifically for compact photographic storage. A photograph converted from HEIC to PNG can therefore become significantly larger.",
          "The exact difference depends on the image, so there is no fixed size ratio between HEIC and PNG.",
        ],
      },
      {
        heading: "Which format should you choose?",
        paragraphs: [
          "Keep HEIC when you are storing photographs and your devices and applications already support it. Choose PNG when you specifically need lossless output, transparency, or compatibility with a workflow that expects PNG.",
        ],
        bullets: [
          "HEIC is usually the better storage format for supported photo libraries",
          "PNG is useful for lossless editing and graphics workflows",
          "PNG supports transparency",
          "Converting HEIC to PNG can substantially increase file size",
          "Keep the original HEIC if the source photo matters to you",
        ],
      },
    ],
    routes: [
      {
        label: "Convert HEIC to PNG",
        href: "/heic-to-png",
      },
      {
        label: "Convert HEIC to JPG",
        href: "/heic-to-jpg",
      },
      {
        label: "Convert HEIC to WebP",
        href: "/heic-to-webp",
      },
    ],
    resources: [
      {
        label: "Learn about the HEIC format",
        href: "/formats/heic",
      },
      {
        label: "Learn about the PNG format",
        href: "/formats/png",
      },
    ],
    related: [
      "heic-vs-jpg",
      "why-iphone-uses-heic",
      "open-heic-on-windows",
      "png-jpg-or-webp",
    ],
  },

  {
    slug: "mp3-vs-wav",
    title: "MP3 vs WAV: which audio format should you choose?",
    description:
      "Understand the difference between MP3 and WAV and choose the right format for editing, sharing and listening.",
    eyebrow: "Audio",
    intro:
      "WAV and MP3 are often used at different stages of an audio workflow. WAV commonly prioritises an uncompressed or lossless working representation, while MP3 prioritises compact files that are convenient to distribute and play.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "WAV for production and editing",
        paragraphs: [
          "WAV is a container that is commonly used for uncompressed PCM audio. That makes it a predictable working format for recording and editing, at the cost of much larger files than compressed delivery formats.",
        ],
      },
      {
        heading: "MP3 for convenient delivery",
        paragraphs: [
          "MP3 removes audio information to reduce file size. At sensible settings it is convenient for listening, sharing and devices where storage or bandwidth matters more than retaining a production master.",
        ],
      },
      {
        heading: "Converting MP3 to WAV does not restore lost detail",
        paragraphs: [
          "Turning an MP3 into WAV can make it compatible with a WAV-based workflow, but it cannot recreate information discarded by the earlier lossy MP3 encoding. Keep an original high-quality source when quality matters.",
        ],
      },
    ],
    routes: [
      { label: "Convert WAV to MP3", href: "/wav-to-mp3" },
      { label: "Convert MP3 to WAV", href: "/mp3-to-wav" },
    ],
    related: ["mp4-vs-webm", "file-conversion-explained"],
  },
  {
    slug: "mp4-vs-webm",
    title: "MP4 vs WebM: which video format should you use?",
    description:
      "Compare MP4 and WebM for browser video, compatibility, codecs and everyday sharing.",
    eyebrow: "Video",
    intro:
      "MP4 and WebM are containers rather than a guarantee of one specific codec or quality level. The best choice depends on where the video needs to play and what codecs the target platform accepts.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "MP4 is the compatibility-first choice",
        paragraphs: [
          "MP4 is supported across a very broad range of consumer software, devices and publishing workflows. When you need to send a video to someone without controlling their playback environment, MP4 is often the simpler choice.",
        ],
      },
      {
        heading: "WebM is closely associated with web delivery",
        paragraphs: [
          "WebM was designed for media on the web and is supported by modern browsers. It can be useful for browser-first assets and workflows that specifically call for WebM-compatible codecs.",
        ],
      },
      {
        heading: "Container is only part of the story",
        paragraphs: [
          "File size and visual quality depend heavily on codec, bitrate, resolution, frame rate and encoder settings. Converting MP4 to WebM does not guarantee a smaller video, and converting WebM to MP4 does not automatically improve compatibility with every application.",
        ],
      },
    ],
    routes: [
      { label: "Convert MP4 to WebM", href: "/mp4-to-webm" },
      { label: "Convert WebM to MP4", href: "/webm-to-mp4" },
    ],
    related: ["mp3-vs-wav", "file-conversion-explained"],
  },
  {
    slug: "svg-vs-png",
    title: "SVG vs PNG: when should you use each?",
    description:
      "Learn when scalable SVG graphics are a better fit than PNG and when raster images are the practical choice.",
    eyebrow: "Graphics",
    intro:
      "SVG describes graphics using vectors and document instructions, while PNG stores a grid of pixels. That difference matters when an image needs to scale, preserve transparency or represent detailed pixel-based artwork.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "SVG stays sharp when it scales",
        paragraphs: [
          "Vector shapes can be redrawn at different sizes without the blockiness associated with enlarging a raster image. That makes SVG especially useful for logos, icons, diagrams and other shape-based graphics.",
        ],
      },
      {
        heading: "PNG is predictable for pixel-based output",
        paragraphs: [
          "PNG is a lossless raster format with transparency support. It is useful when you need fixed pixel dimensions, compatibility with raster-only software, screenshots or graphics whose detail is fundamentally pixel based.",
        ],
      },
      {
        heading: "Why convert SVG to PNG?",
        paragraphs: [
          "A PNG export can be useful when a destination does not accept SVG, when you need an exact raster size, or when you want to freeze the rendered appearance of a vector asset. Keep the original SVG if you may need to resize or edit the vector later.",
        ],
      },
    ],
    routes: [
      { label: "Convert SVG to PNG", href: "/svg-to-png" },
      { label: "Convert SVG to WebP", href: "/svg-to-webp" },
      { label: "Optimise an SVG", href: "/optimize-svg" },
    ],
    related: ["png-jpg-or-webp", "file-conversion-explained"],
  },
  {
    slug: "file-conversion-explained",
    title: "What happens when you convert a file?",
    description:
      "A practical explanation of file conversion, extensions, codecs, quality and why converted files can look or sound different.",
    eyebrow: "File basics",
    intro:
      "Changing a file extension and converting a file are not the same thing. A real conversion reads information in one representation and writes it into another, which can require decisions about features the destination format cannot represent in exactly the same way.",
    updated: "2026-08-20",
    sections: [
      {
        heading: "The extension is a label, not the contents",
        paragraphs: [
          "Renaming photo.png to photo.jpg does not perform a PNG-to-JPG conversion. Software still encounters PNG-encoded data inside the renamed file. A converter decodes the source and creates data that follows the destination format.",
        ],
      },
      {
        heading: "Some conversions are lossy",
        paragraphs: [
          "A destination format may discard information to reduce size or because it cannot store a feature from the source. That can affect image detail, audio information, transparency, document structure or metadata.",
        ],
      },
      {
        heading: "Containers and codecs are different",
        paragraphs: [
          "Video and audio filenames can hide another layer of complexity. A container such as MP4 can carry streams encoded with different codecs, so two files with the same extension are not necessarily encoded the same way.",
        ],
      },
      {
        heading: "Check important outputs",
        paragraphs: [
          "For important documents, media or production assets, inspect the converted result before deleting the source. Conversion is a transformation, and the correct output depends on what you need to preserve.",
        ],
      },
    ],
    routes: [{ label: "Browse available conversions", href: "/conversions" }],
    related: [
      "docx-vs-pdf",
      "png-jpg-or-webp",
      "mp3-vs-wav",
      "mp4-vs-webm",
      "svg-vs-png",
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug);
}
