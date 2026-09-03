# SVG → WebP acquisition experiment

Date started: 2026-09-03

## Goal

Test whether a focused transactional page can gain search visibility by combining exact search intent with a natural SVG topic cluster already present in Convertix.

## Search Console baseline

28-day site baseline:
- 659 impressions
- 5 clicks
- 0.8% CTR
- 75.8 average position

Visible query baseline:
- `svg to webp`: 5 impressions
- 0 clicks
- 59.6 average position

This baseline is query-level from the 28-day Search Console report. Capture the page-filtered `/svg-to-webp` baseline at the first follow-up if more data is available.

## Hypothesis

Google is already testing Convertix for the exact transactional query `svg to webp`. The page currently relies on generic conversion-page metadata and heading behaviour, while Convertix already has relevant SVG supporting content and an SVG optimizer.

A dedicated search title/H1 plus reciprocal links between the converter, SVG guide, format pages, and optimizer should make the page's purpose and topical relationship clearer without creating another thin page.

## Changes

- Add dedicated `SVG to WebP Converter` H1 treatment.
- Add dedicated SVG → WebP title, description, and query metadata.
- Use a descriptive `SVG to WebP Converter` internal anchor.
- Link the existing SVG vs PNG guide directly to SVG → WebP.
- Surface the SVG vs PNG guide from the SVG → WebP converter.
- Add a reciprocal path between `/svg-to-webp` and `/optimize-svg`.

## Success criteria

First checkpoint:
- `svg to webp` average position improves from 59.6 toward <45, or
- impressions materially increase while the query remains clearly transactional.

Second checkpoint:
- reach the top 30 for `svg to webp` or a closely related transactional query.

CTR is secondary until the page is visible high enough to receive realistic clicks.

## Follow-up

After deployment:
1. Request indexing for `https://convertix.uk/svg-to-webp`.
2. Request indexing for `https://convertix.uk/formats/svg`.
3. Request indexing for `https://convertix.uk/formats/webp`.
4. Request indexing for `https://convertix.uk/guides/svg-vs-png`.
5. Request indexing for `https://convertix.uk/optimize-svg`.
6. Re-check Search Console after enough data has accumulated.
7. Do not create additional SVG → WebP keyword pages unless Search Console shows a genuinely different user intent.
