# Convertix web

The Next.js frontend for Convertix. It provides the public homepage, an accessible file-conversion workflow, and reusable conversion routes such as `/convert/docx-to-pdf`.

## Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Useful checks:

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and set only the capabilities available in the backend deployment.

- `NEXT_PUBLIC_CONVERTIX_SITE_URL`: public origin used for canonical URLs and the sitemap.
- `NEXT_PUBLIC_CONVERTIX_API_URL`: FastAPI base URL, without a trailing slash.
- `NEXT_PUBLIC_CONVERTIX_ENABLED_CONVERSIONS`: comma-separated route slugs or `source:target` pairs, for example `docx-to-pdf,png:jpg`. Leave empty until those routes work end to end.
- `NEXT_PUBLIC_CONVERTIX_SUBMISSION_MODE`: set to `metadata-only` only when testing the current `POST /conversions` metadata contract. It does not upload the selected browser file.

## Format configuration

Formats, extensions, families, and known conversion pairs live in `src/lib/formats.ts`. The UI derives file detection, target options, popular routes, SEO routes, and the format catalogue from that single model.

Known and enabled are deliberately separate. Adding a pair to the model prepares the UI and route; it becomes actionable only when `NEXT_PUBLIC_CONVERTIX_ENABLED_CONVERSIONS` enables it for a deployment.

## Backend integration status

The typed API client lives in `src/lib/conversion-api.ts` and keeps `fetch()` out of components. It supports the documented metadata request:

```json
{
  "source_format": "docx",
  "target_format": "pdf"
}
```

The checked-in FastAPI service currently exposes `/health` but not `/conversions`. Browser upload, presigned S3 transfer, status polling, and download URLs are also not implemented in this repository. The frontend therefore does not simulate upload or completion, and routes are disabled by default.

When the backend gains presigned transfer support, add the upload implementation behind the service layer before enabling production conversion pairs. Keep API state mapped to the existing `ConversionStatus` model instead of adding unrelated component booleans.
