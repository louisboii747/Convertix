# Feature launch checklist

Shipping working code is only the engineering part of a Convertix launch.

Use this checklist for meaningful public features that can attract users, such as:

- a new conversion format
- a new converter cluster
- a new standalone tool
- a major workflow improvement
- a feature with its own search or distribution opportunity

Small bug fixes, refactors, dependency updates, internal infrastructure work, and minor UI polish do **not** need a full public launch.

## 1. Engineering complete

Before promoting the feature:

- [ ] The feature works end to end in production
- [ ] Supported frontend and backend capabilities agree
- [ ] Failure states are clear
- [ ] Relevant tests pass
- [ ] Lint, typecheck, and production build pass where applicable
- [ ] Analytics capture meaningful starts, completions, and failures
- [ ] User-facing claims match the actual implementation

A feature is not ready for distribution just because its code has merged.

## 2. Search and discovery

For features with search intent:

- [ ] Create a dedicated indexable landing page where justified
- [ ] Write a useful page title and meta description
- [ ] Add a canonical URL
- [ ] Confirm the route appears in the sitemap
- [ ] Add relevant internal links from existing pages
- [ ] Link to related format pages, tools, or guides
- [ ] Add supporting guide content when it answers a real user question
- [ ] Check the production URL is indexable
- [ ] Inspect or submit the URL in Google Search Console

Avoid creating thin pages only to target keywords.

## 3. Product discoverability

Make sure existing users can find the feature:

- [ ] Surface it from the appropriate Convertix navigation or directory
- [ ] Add it to `/conversions`, `/tools`, or another relevant discovery page
- [ ] Link related converters and tools together
- [ ] Make supported input and output formats obvious
- [ ] Keep the primary task above SEO or promotional content

## 4. Distribution

Choose distribution based on where the target user actually spends time.

Possible launch actions:

- [ ] Create a short product demo or screen recording
- [ ] Publish a concise problem-led social post
- [ ] Share it in one relevant community where promotion is appropriate
- [ ] Update relevant directory or product listings
- [ ] Use a specific landing page as the destination instead of always linking to the homepage

Do not spam multiple unrelated communities with the same generic launch message.

A useful launch message explains the problem first.

For example:

> iPhone HEIC photos still fail in some Windows and web workflows, so Convertix can now convert HEIC directly to JPG, PNG, or WebP.

This is stronger than:

> Convertix just added another format!

## 5. Measurement

Record a baseline before or immediately after launch.

Track where available:

- [ ] Search impressions
- [ ] Organic clicks
- [ ] Landing-page sessions
- [ ] Conversion starts
- [ ] Successful conversions
- [ ] Conversion failures
- [ ] Returning users
- [ ] Unsupported-format requests related to the feature

Use Search Console to diagnose discovery and PostHog to diagnose product behaviour.

A simple interpretation:

- no impressions → discovery, indexing, or demand problem
- impressions but few clicks → search-intent or snippet problem
- clicks but few starts → landing-page or UX problem
- starts but few completions → reliability problem

## 6. Follow-up

A launch is not finished on release day.

- [ ] Review initial results after enough data has accumulated
- [ ] Record useful findings in the related GitHub issue
- [ ] Improve pages ranking within reach of useful search positions
- [ ] Fix repeated conversion failures
- [ ] Use observed unsupported-format demand to guide follow-up work
- [ ] Decide whether the feature deserves more distribution or supporting content

Do not keep promoting a feature blindly if the data shows a different problem.

## Pull request reminder

For acquisition-worthy converter or tool PRs, include a note such as:

> Launch checklist: `docs/feature-launch-checklist.md`

The PR does not need every distribution task completed before merge. Engineering and distribution are separate stages, but both should be tracked for meaningful public launches.
