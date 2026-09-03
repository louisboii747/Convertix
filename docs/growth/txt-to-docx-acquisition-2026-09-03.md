# TXT → DOCX acquisition experiment

Date started: 2026-09-03

## Goal

Test whether tightening the existing TXT → DOCX converter around both DOCX and everyday "Word" language improves visibility for transactional searches without creating another landing page.

## Search Console baseline

28-day page baseline:
- `/txt-to-docx`: 17 impressions
- 0 clicks

Visible query baseline:
- `txt to docx`: 3 impressions
- `txt to docx converter`: 2 impressions
- `txt to word converter`: 1 impression
- `text to docx`: 1 impression
- `convert txt to word`: 1 impression
- `txt to word docx`: 1 impression

The screenshot used for this baseline did not include average-position values, so position should be captured at the first follow-up rather than inferred.

## Hypothesis

Google already understands the page as a transactional TXT → DOCX converter. Search Console also shows users describe the same task using "Word" language.

A stronger title/snippet, exact converter anchor text, and tighter links between the converter and the existing TXT/DOCX format pages should clarify the intent while keeping one canonical page for the task.

## Changes

- Change the title to lead with `TXT to DOCX Converter`.
- Include "Word" naturally in the title, description, hero copy, and keyword set.
- Add `TXT to DOCX Converter` as the descriptive internal anchor.
- Add focused links from the converter to the existing TXT and DOCX format pages.

## Success criteria

First checkpoint:
- page impressions materially increase from the 17-impression baseline, and/or
- one or more transactional TXT → DOCX / TXT → Word queries improve in average position once position data is captured.

Second checkpoint:
- reach the top 30 for at least one meaningful transactional query.

CTR is secondary until the page is visible high enough to receive realistic clicks.

## Follow-up

After deployment:
1. Request indexing for `https://convertix.uk/txt-to-docx`.
2. Request indexing for `https://convertix.uk/formats/txt`.
3. Request indexing for `https://convertix.uk/formats/docx`.
4. Re-check Search Console after enough data has accumulated.
5. Do not create separate `txt-to-word` and `text-to-docx` pages unless future data proves they represent genuinely different intent.
