# XLSX → PDF acquisition experiment

Date started: 2026-09-05

## Goal

Test whether tightening exact-match transactional signals around the existing XLSX → PDF converter improves visibility for the query `xlsx to pdf` without creating duplicate or thin landing pages.

## Search Console baseline

7-day site baseline captured from the report covering 2026-08-28 through 2026-09-03:
- 556 impressions
- 2 clicks
- 0.4% CTR
- 74.2 average position

Visible query baseline:
- `xlsx to pdf`: 5 impressions
- 0 clicks
- 58.4 average position

## Hypothesis

Google is already testing Convertix for the exact transactional query `xlsx to pdf`, and it is one of the strongest visible conversion-intent queries in the current Search Console data.

The page already covers the broader `Excel to PDF` wording. Leading the metadata and internal anchor text with the exact `XLSX to PDF` wording should sharpen relevance for the query Google is already testing while preserving the existing Excel terminology in the H1 and supporting copy.

## Changes

- Change the search title to lead with `XLSX to PDF Converter` while retaining `Convert Excel to PDF Online` as the secondary phrase.
- Rewrite the meta description to lead with `Convert XLSX to PDF online` and clearly describe the workbook-to-fixed-PDF use case.
- Expand the query metadata with direct variants such as `xlsx to pdf converter`, `xlsx to pdf online`, and `excel spreadsheet to pdf`.
- Change the search-friendly internal link label from `Excel to PDF` to `XLSX to PDF` so conversion directories and related-conversion links reinforce the exact query.
- Keep the existing `Excel to PDF Converter` H1 so the page still naturally covers the common Excel wording.
- Do not create another XLSX → PDF landing page.

## Success criteria

First checkpoint:
- `xlsx to pdf` average position improves from 58.4 toward <45, or
- impressions materially increase while the query remains clearly transactional.

Second checkpoint:
- reach the top 30 for `xlsx to pdf` or a closely related high-intent XLSX → PDF query.

CTR is secondary until the page is visible high enough to receive realistic clicks.

## Follow-up

After deployment:
1. Request indexing for `https://convertix.uk/xlsx-to-pdf`.
2. Request indexing for `https://convertix.uk/formats/xlsx`.
3. Request indexing for `https://convertix.uk/formats/pdf`.
4. Request indexing for `https://convertix.uk/conversions`.
5. Re-check the same 7-day Search Console query report after enough post-deployment data has accumulated.
6. Avoid further major changes to the XLSX → PDF page before the first checkpoint so the experiment remains measurable.
