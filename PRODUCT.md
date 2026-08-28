# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is an ordinary web user who needs to convert, compress, merge, or optimise a file quickly without installing software or understanding technical details. Typical files include CVs, coursework, business documents, images, spreadsheets, presentations, audio, and video.

The core conversion job is: “I have this file, I need it in this other format, and I want to convert it quickly with as little friction as possible.”

The tools area also serves adjacent jobs such as compressing a batch of images, compressing or merging PDFs, and optimising SVGs.

Technical users may also use Convertix, but the public product is designed primarily for consumers rather than developers.

## Product Purpose

Convertix lets a user arrive from the web, provide a file, choose a target format, convert it, download the result, and leave. Basic conversion does not require an account.

Alongside cloud-backed conversions, Convertix includes focused browser tools where local processing is practical. Those tools should make privacy and cost advantages clear without implying that every Convertix workflow stays on-device.

The product should make common file jobs immediate, understandable, and trustworthy. Success means the user completes the job with minimal friction while the product remains accurate about supported formats, processing, and privacy.

## Positioning

The converter remains the core product, supported by focused tools for common file problems. Convertix should present one coherent, polished experience rather than a disconnected collection of utilities.

Convertix differentiates through product quality, simplicity, trust, useful file tooling, minimal visual clutter, strong mobile and desktop experiences, accessibility, and a mix of cloud-backed and browser-local processing where each makes sense.

AI is not a product differentiator unless a future AI-powered file feature provides genuine user value.

## Operating Context

Many users arrive with an immediate task, often from search. Dedicated conversion pages such as `/docx-to-pdf` should take them directly to the relevant converter while retaining one consistent product experience.

The intended basic conversion workflow is:

1. Arrive at Convertix or a dedicated conversion page.
2. Select a file through a picker or drag and drop.
3. Choose an available target format.
4. Start the conversion and receive accessible progress or status feedback.
5. Download the converted file.

The interaction promise is: “Drop your file here. We’ll handle the rest.” File selection must never depend on drag and drop alone.

Focused tools may use different workflows when that better fits the task. For example, the batch image compressor accepts multiple files, processes them locally, and can package successful outputs into one ZIP.

## Current Capabilities and Constraints

- Basic file conversion does not require an account.
- Accounts and conversion history are available as optional conveniences.
- The supported conversion matrix is centrally configured in the frontend and must not advertise a pair as live unless the backend can perform it.
- Current conversion families include documents, images, audio, video, and spreadsheets.
- Dedicated public pages exist for enabled conversion pairs, formats, guides, and tools.
- Current focused tools include PDF merging, PDF compression, image compression, and SVG optimisation.
- The image compressor supports batches of up to 30 JPG, PNG, or WebP images.
- Batch image compression runs in the browser, with a 25 MB per-image limit and 150 MB total batch limit.
- Batch image results can be downloaded individually or packaged into a ZIP in the browser.
- Files used by the batch image compressor are not uploaded to Convertix for processing.
- Browser-local tools must say so only when implementation evidence confirms it.
- Cloud-backed conversions use the AWS conversion path, including upload storage, an API, queueing, and ECS/Fargate workers.
- Uploaded and converted files may be temporarily stored while cloud conversions are provided. Do not publish a specific deletion window until cleanup enforcement has been verified.
- Privacy and security messaging must remain technically accurate. Do not claim zero-knowledge processing, end-to-end encryption, or an unverified retention period.
- The intended commercial direction is a useful free basic experience with inexpensive optional paid functionality later. Detailed pricing remains undecided and must not be invented.
- Longer-term possibilities include richer batch conversion, presets, APIs, integrations, and native clients. They must not be presented as current functionality.

## Discovery and Product Growth

Important product capabilities should be discoverable from more than their destination page.

- `/tools` should accurately describe the strongest current tool features.
- The homepage may spotlight differentiated tools that give users a clear reason to explore beyond the generic converter.
- Site search should include meaningful feature keywords, not only route names.
- The sitemap should include all public tools and enabled conversion pages.
- Search landing pages should target real user intent without creating thin or misleading pages.
- Product analytics should measure conversion funnel steps, failures, unsupported-format demand, download behaviour, and conversion timing where consent permits.

Unsupported-format telemetry is intended to help choose future conversion work based on observed demand rather than format-count competition.

## Batch Image Compression

The batch image compressor at `/compress-image` is a current public feature.

It supports:

- JPG, PNG, and WebP
- up to 30 images in one batch
- up to 25 MB per image
- up to 150 MB per batch
- Light, Balanced, and Maximum compression modes
- per-image progress and results
- individual downloads
- Download all as ZIP
- local browser processing without AWS conversion compute

The feature should be described publicly as batch-capable. Avoid reverting public copy to language that implies only one image can be processed at a time.

## Brand Commitments

The fixed product name is **Convertix**.

The working tagline is **Convert files without the fuss.** The wording may evolve and is not immutable.

The public web experience should use a bright, simple consumer identity and familiar file-tool conventions executed at a high level of craft. CloudConvert is a useful benchmark for conversion UX and format handling, Dropbox for approachable and trustworthy file interactions, and Linear for typography, spacing, and micro-interactions. Convertix must not visually imitate any of them.

Product language should be plain, reassuring, concise, and honest. It must not exaggerate format support, security, privacy, processing readiness, or future functionality.

## Evidence on Hand

- [apps/web/src/components/converter.tsx](apps/web/src/components/converter.tsx) contains the current public conversion flow and PostHog event capture.
- [apps/web/src/lib/formats.ts](apps/web/src/lib/formats.ts) contains the configured conversion matrix.
- [apps/web/src/components/image-compressor.tsx](apps/web/src/components/image-compressor.tsx) contains browser-local batch image compression and ZIP download behaviour.
- [apps/web/src/app/tools/page.tsx](apps/web/src/app/tools/page.tsx) lists current focused tools.
- [apps/web/src/app/sitemap.ts](apps/web/src/app/sitemap.ts) lists public tool, format, guide, and conversion routes for indexing.
- [services/api](services/api) and [services/worker](services/worker) contain the cloud conversion API and worker implementation.
- [infrastructure](infrastructure) contains the AWS infrastructure definitions.

Do not use older scaffold-era documentation as evidence that current production features are missing when the implementation now proves otherwise.

## Product Principles

1. Put the user’s file task first.
2. Remove unnecessary friction from basic conversion, including mandatory accounts.
3. Earn trust through reliable behaviour and claims that match the implementation.
4. Keep one coherent experience across format families, tools, devices, and dedicated landing pages.
5. Prefer evidence-driven expansion over chasing raw format count.
6. Use browser-local processing when it materially improves privacy, speed, or cost without compromising reliability.
7. Make important features easy to discover after they ship.

## Accessibility & Inclusion

Accessibility is a product requirement. Aim for WCAG 2.2 AA-quality behaviour where practical, including keyboard navigation, visible focus states, semantic HTML, accessible forms and controls, sufficient contrast, screen-reader-friendly status updates, reduced-motion support, and a file picker alternative to drag and drop.
