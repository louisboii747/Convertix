# MP3 → WAV acquisition experiment

Date started: 2026-09-03

## Goal

Use the existing MP3/WAV topic cluster to move the transactional `/mp3-to-wav` page closer to search visibility and establish a repeatable acquisition workflow for Convertix.

## Search Console baseline

28-day site baseline:
- 659 impressions
- 5 clicks
- 0.8% CTR
- 75.8 average position

`/mp3-to-wav`:
- 26 impressions
- 0 clicks
- 64.9 average position

Visible query examples:
- `mp3 to wav`: 4 impressions, position 65.5
- `convert mp3 to wav`: 4 impressions, position 67.8
- `mp3 to wav converter`: 3 impressions, position 60.3
- `mp3 converter to wav`: 3 impressions, position 66.7
- `mp3 to wav converter`: 2 impressions, position 58.5
- `download mp3 to wav converter`: 1 impression, position 56.0

Supporting pages:
- `/formats/wav`: 101 impressions, position 86.3
- `/formats/mp3`: 30 impressions, position 83.8

## Hypothesis

Google already understands `/mp3-to-wav` as a transactional MP3 → WAV page, but Convertix currently lacks enough authority to rank strongly. Strengthening descriptive internal anchors, reciprocal topical links, and the search snippet gives the cluster a cleaner structure without creating duplicate keyword pages.

## Changes

- Use descriptive internal anchors: “MP3 to WAV Converter” and “WAV to MP3 Converter”.
- Link the MP3/WAV converter pages directly to the existing `mp3-vs-wav` guide.
- Update the MP3 → WAV title and description around the exact transactional intent and current product facts.

## Success criteria

Do not judge this by daily noise.

First checkpoint:
- average position for `/mp3-to-wav` improves from ~65 toward <50, or
- impressions materially increase while query relevance remains transactional.

Second checkpoint:
- reach the top 30 for at least one meaningful MP3 → WAV query.

CTR is not the primary metric until the page is visible high enough to earn realistic clicks.

## Follow-up

After deployment:
1. Request indexing for `https://convertix.uk/mp3-to-wav`.
2. Request indexing for `https://convertix.uk/formats/mp3`, `https://convertix.uk/formats/wav`, and `https://convertix.uk/guides/mp3-vs-wav`.
3. Re-check Search Console after enough data has accumulated.
4. Do not add another MP3/WAV page unless new query evidence shows a genuinely different intent.
