# HEIC / HEIF support launch — 30 August 2026

Issue: #30

## Goal

Turn the shipped HEIC / HEIF support into an acquisition surface rather than treating it as an engineering-only release.

Primary landing page:

- https://convertix.uk/heic-to-jpg

Supporting converter pages:

- https://convertix.uk/heic-to-png
- https://convertix.uk/heic-to-webp
- https://convertix.uk/heif-to-jpg
- https://convertix.uk/heif-to-png
- https://convertix.uk/heif-to-webp

Supporting guides:

- https://convertix.uk/guides/heic-vs-jpg
- https://convertix.uk/guides/open-heic-on-windows
- https://convertix.uk/guides/why-iphone-uses-heic
- https://convertix.uk/guides/heic-vs-png

Format page:

- https://convertix.uk/formats/heic

## Positioning

Lead with the user problem:

> iPhone HEIC photos still fail in some Windows apps and upload workflows. Convertix can now turn HEIC or HEIF images into JPG, PNG, or WebP.

Do not lead with a generic "we added another format" announcement.

The primary CTA should point directly to:

> https://convertix.uk/heic-to-jpg

rather than the Convertix homepage.

## Short demo plan

Target length: 12–18 seconds.

1. Start on `/heic-to-jpg`.
2. Drag in a real iPhone `.heic` photo.
3. Show Convertix detecting HEIC rather than mislabelling it as JPG.
4. Start the conversion.
5. Show the completed JPG download.
6. End on a simple text frame: "HEIC → JPG, PNG or WebP · convertix.uk/heic-to-jpg".

Keep the recording focused on the problem and result. No architecture explanation is needed in the launch video.

## Social post

> Ever moved an iPhone photo to Windows or a website and found the HEIC file would not open or upload?
>
> I added proper HEIC/HEIF support to Convertix. It now detects the actual image format and converts HEIC or HEIF photos to JPG, PNG, or WebP.
>
> I also wrote a few practical guides covering HEIC vs JPG, Windows support, and why iPhones use HEIC.
>
> HEIC → JPG: https://convertix.uk/heic-to-jpg
>
> If you have an iPhone photo workflow that still breaks somewhere, I would be interested to hear where.

## Community post

Suggested community: r/SideProject, using the appropriate self-promotion flair and only if current subreddit rules permit it at posting time.

Title:

> I fixed the iPhone HEIC problem in my file converter after hitting it myself

Body:

> I recently tried an iPhone photo in Convertix and found a fairly embarrassing bug: the upload was being treated like a JPG and the conversion failed.
>
> I ended up adding proper content-based HEIC/HEIF detection plus conversions to JPG, PNG and WebP. While doing it I also had to handle EXIF orientation, colour profiles, metadata and transparency correctly rather than just renaming extensions.
>
> The useful part for normal users is much simpler: if an iPhone HEIC image will not work in a Windows app or upload form, it can now be converted directly here:
>
> https://convertix.uk/heic-to-jpg
>
> I also added guides explaining why iPhones use HEIC and how Windows handles it.
>
> If anyone has HEIC files from other devices/cameras, I would be interested in whether they work too.

Do not cross-post the same text across several communities.

## Directory / profile blurb

Use this when a directory supports feature or description updates:

> Convertix is a free online file conversion platform with dedicated HEIC and HEIF support. iPhone and other HEIF-family images can be converted to JPG, PNG, or WebP, with dedicated HEIC guides for Windows compatibility and format choices.

## Search Console submission list

Inspect/request indexing for these URLs in this order:

1. https://convertix.uk/heic-to-jpg
2. https://convertix.uk/guides/open-heic-on-windows
3. https://convertix.uk/guides/heic-vs-jpg
4. https://convertix.uk/guides/why-iphone-uses-heic
5. https://convertix.uk/guides/heic-vs-png
6. https://convertix.uk/formats/heic
7. https://convertix.uk/heic-to-png
8. https://convertix.uk/heic-to-webp
9. https://convertix.uk/heif-to-jpg
10. https://convertix.uk/heif-to-png
11. https://convertix.uk/heif-to-webp

Also confirm the sitemap remains submitted:

- https://convertix.uk/sitemap.xml

## Baseline

Launch date: 2026-08-30

Public search spot-check before launch:
- exact Convertix HEIC landing pages did not surface in the search results checked on 2026-08-30
- Convertix itself is already present in external search results through its SaaSHub listing and earlier Reddit posts

This public spot-check is not a substitute for Google Search Console data.

Record the real baseline from Search Console and PostHog before or immediately after distribution:

| Metric | Baseline | Follow-up |
| --- | ---: | ---: |
| HEIC-route search impressions | pending | pending |
| HEIC-route organic clicks | pending | pending |
| HEIC landing-page sessions | pending | pending |
| HEIC conversion starts | pending | pending |
| Successful HEIC conversions | pending | pending |
| HEIC conversion failures | pending | pending |
| Returning users from HEIC pages | pending | pending |

## Status

Completed:
- HEIC/HEIF conversion support shipped
- six dedicated HEIC/HEIF converter pages
- rich conversion-specific landing-page content
- four-guide HEIC/iPhone content cluster
- HEIC format page
- converter-to-guide and guide-to-converter internal linking
- reusable launch copy
- community-post draft
- directory/profile blurb
- demo shot list
- Search Console URL priority list
- GitHub README updated to reflect live HEIC/HEIF support

Requires an authenticated external account:
- record Search Console baseline and request indexing
- record PostHog baseline
- record the short demo
- publish the chosen social/community post
- update third-party directory profiles where an owner login is required

## Follow-up

Review the HEIC cluster after enough search and conversion data has accumulated.

Use:
- Search Console for impressions, clicks, CTR and average position
- PostHog for landing sessions, conversion starts, completions and failures

Prioritise pages with impressions but weak CTR, and pages with clicks but weak conversion starts.
