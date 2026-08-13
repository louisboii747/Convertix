# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary launch user is an ordinary web user who needs to convert a file quickly without installing software, creating an account, or understanding technical details. Typical files include CVs, coursework, business documents, images, spreadsheets, and presentations.

The core job is: “I have this file, I need it in this other format, and I want to convert it quickly with as little friction as possible.” DOCX to PDF, such as converting a CV before a job application, is a representative launch use case.

Technical users may also use Convertix, but the public product is designed primarily for consumers rather than developers.

## Product Purpose

Convertix lets a user arrive from the web, provide a file, choose a target format, convert it, download the result, and leave. Basic conversion should work without an account.

The launch product should make common file conversion immediate, understandable, and trustworthy. Success means the user completes the conversion with minimal friction while the product remains accurate about supported formats, processing, and privacy.

## Positioning

The converter is the product. Convertix should present one exceptionally simple, polished interface across many file types instead of behaving like a collection of disconnected conversion tools or burying the task beneath a large marketing page.

Convertix differentiates through product quality, simplicity, trust, breadth, fast cloud-backed processing, minimal visual clutter, strong mobile and desktop web experiences, and accessibility. It should feel like a modern consumer SaaS product rather than a traditional free online converter site.

AI is not a product differentiator unless a future AI-powered conversion feature provides genuine user value.

## Operating Context

Many users arrive with an immediate, consequential task, often from search. Dedicated pages such as `/convert/docx-to-pdf` should help them reach the relevant converter directly while retaining one consistent product experience.

The intended basic workflow is:

1. Arrive at Convertix or a dedicated conversion page.
2. Select a file through a picker or drag and drop.
3. Choose an available target format.
4. Start the conversion and receive accessible progress or status feedback.
5. Download the converted file.

The interaction promise is: “Drop your file here. We’ll handle the rest.” File selection must never depend on drag and drop alone.

## Capabilities and Constraints

- Basic file conversion must not require an account or be placed behind a paywall during the initial product phase.
- The initial format domain includes PDF, DOCX, DOC, TXT, JPG/JPEG, PNG, WEBP, XLSX, XLS, CSV, and PPTX. Support may be added progressively, and DOCX to PDF is a representative core launch conversion.
- The supported format matrix must be centrally configurable rather than duplicated or hard-coded throughout the frontend.
- A conversion pair must not be advertised as working until the backend can actually perform it.
- Uploaded and converted files are intended to use short-lived storage with automatic cleanup, but no deletion interval or stronger privacy guarantee is confirmed until it is implemented and enforced.
- Privacy and security messaging must remain technically accurate. Do not claim zero-knowledge processing, end-to-end encryption, or a specific automatic deletion window without implementation evidence.
- Accounts may later add conversion history, saved files or settings, higher limits, and other conveniences.
- The intended commercial direction is a useful free basic experience with inexpensive optional paid functionality later. Detailed pricing is undecided and must not be invented.
- Longer-term possibilities include APIs, download management, additional tools, and native clients. They must not be presented as current functionality.
- The current platform is web. API boundaries should avoid unnecessarily preventing future native clients, without describing the current product as cross-platform.
- The repository contains a Next.js frontend, FastAPI components, PostgreSQL, Redis and SQS worker plumbing, and AWS and Cloudflare infrastructure. The AWS conversion path includes an API, SQS queue, and ECS/Fargate worker.
- Browser upload and download plumbing and real conversion processing are still in development. The current code is an early foundation, not a production-ready end-to-end conversion service.

## Brand Commitments

The fixed product name is **Convertix**.

The working tagline is **Convert files without the fuss.** The wording may evolve and is not immutable.

The public web experience should use a bright, simple consumer identity and familiar conversion conventions executed at a high level of craft. CloudConvert is a benchmark for conversion UX and format handling, Dropbox for approachable and trustworthy file interactions, and Linear for typography, spacing, and micro-interactions. Convertix must not visually imitate any of them.

Product language should be plain, reassuring, concise, and honest. It must not exaggerate format support, security, privacy, processing readiness, or future functionality.

## Evidence on Hand

- [README.md](README.md) records the product direction, monorepo architecture, planned format families, and early-development status.
- [apps/web](apps/web) contains the Next.js launch frontend, which is currently an uncustomized application scaffold rather than product UI.
- [services/api](services/api) contains the FastAPI and PostgreSQL foundation, including a database-aware health endpoint.
- [services/worker/worker.py](services/worker/worker.py) contains SQS polling and job acknowledgement plumbing. Its conversion-processing behavior is explicitly temporary and does not prove real conversion capability.
- [infrastructure/terraform](infrastructure/terraform) contains the current AWS infrastructure definitions.
- There is no current implementation evidence for production-ready browser upload, download, file cleanup, or an advertised conversion pair. Future product work must not fabricate those capabilities.
- No testimonials, customer claims, benchmarks, pricing details, or production privacy guarantees are currently on hand.

## Product Principles

1. Put the conversion task first; the converter is the product.
2. Remove unnecessary friction from basic conversion, including mandatory accounts and technical language.
3. Earn trust through reliable behavior and claims that match the implementation.
4. Keep one coherent experience across format families, devices, and dedicated conversion pages.
5. Grow the platform without compromising the clarity of the core conversion workflow.

## Accessibility & Inclusion

Accessibility is a launch requirement. Aim for WCAG 2.2 AA-quality behavior where practical, including keyboard navigation, visible focus states, semantic HTML, accessible forms and controls, sufficient contrast, screen-reader-friendly conversion status updates, reduced-motion support, and a file picker alternative to drag and drop.
