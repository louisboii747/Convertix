# Guest conversion feedback fixes

- The web converter accepts guest conversions without an account or a conversion-count quota. Accounts remain optional for saving future conversion history.
- Merge PDF, Compress PDF, Batch Image Compressor and Optimize SVG are public pages. Account pages and history APIs still require authentication.
- The upload instructions now describe when the file uploads, and the primary action stays “Convert file” for guests.
- The homepage headline is static, so visitors never see an incomplete typing animation.
- JPG/JPEG can produce AVIF, GIF and HEIC in addition to PNG, WebP and PDF. GIF output is a single still image with up to 256 colours. AVIF and GIF uploads are not newly supported.

## Rollout order

Deploy `services/api/lambda_base.py` and rebuild/deploy the worker image before deploying the frontend with the new output options. The worker image checks for AVIF encoding and the HEVC encoder during build. Existing worker installations will reject these new target formats until updated.

There are no Supabase migrations or new dependencies. Guest conversions do not write to account history; authenticated conversions continue to use the protected history endpoint.

## Validation

From the repository root:

```bash
AWS_EC2_METADATA_DISABLED=true python -m pytest services/worker services/api -q
```

From `apps/web`:

```bash
npm test
npm run build
```

For the guest browser regression, start a local server with `NEXT_PUBLIC_CONVERTIX_API_URL` set to the same local origin, install the Chromium browser for Playwright, then run:

```bash
npm run test:guest:browser
```

`GUEST_TEST_SITE_URL` overrides `http://localhost:3000`. `GUEST_TEST_BROWSER_PATH` optionally selects a Chromium executable. The test mocks conversion/storage and auth responses, checks repeated guest downloads with missing/unavailable authentication, and runs the image compressor and SVG optimizer in the actual browser. API/worker tests separately exercise queue acceptance and real JPG encoding, orientation and output MIME types.
