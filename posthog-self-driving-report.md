# PostHog Self-driving Setup Report — Convertix

**Project:** Convertix (converter-platform)
**Date:** 2026-08-19
**PostHog project:** 252531

## Summary

PostHog Self-driving has been configured for Convertix: Session Replay, Error Tracking, and Support (Conversations) products were enabled; six native signal sources were wired up; GitHub was connected; a seven-scout troop (five built-in + two custom) was tuned to Convertix's actual surfaces; and two Replay Vision scanners were armed on the conversion flow and rage-click sessions. Findings will start appearing in the [Self-driving inbox](https://eu.posthog.com/project/252531/inbox) within approximately 30 minutes.

---

## AI data processing

**Status:** Approved. Organisation-level AI data processing consent was granted before this run started.

---

## GitHub

| Item | Status |
|---|---|
| GitHub App integration | Connected during this run (account: `louisboii747`) |
| Integration ID | 78873 |

---

## Products enabled

The `products-enable` tool is not available on this PostHog deploy. The three products must be enabled manually.

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Follow-up required** | Enable in PostHog → Settings → Session replay → "Record user sessions". The `posthog.init` in `instrumentation-client.ts` does not disable recording, so the server flip takes effect immediately once on. |
| Error Tracking | **Follow-up required** | Enable in PostHog → Settings → Error tracking → "Enable exception autocapture". `capture_exceptions: true` is already set in `instrumentation-client.ts`, so the server flip takes effect immediately. |
| Support (Conversations) | **Follow-up required** | Enable via the Support product in the PostHog sidebar. Tickets only arrive once an inbound channel (email / inbox / Slack) is connected — see Follow-ups. |

---

## Signal sources

| source_product | source_type | Action | Config ID |
|---|---|---|---|
| `health_checks` | `health_issue` | Enabled | `01a019d3-7121-7393-a98b-38cdea92dccf` |
| `error_tracking` | `issue_created` | Enabled | `01a019d3-73de-7ca2-9574-793b82ebc622` |
| `error_tracking` | `issue_reopened` | Enabled | `01a019d3-7816-7140-9a76-b65139cb6348` |
| `error_tracking` | `issue_spiking` | Enabled | `01a019d3-7ac6-7cb9-8612-28cb40be9a3c` |
| `session_replay` | `session_analysis_cluster` | Enabled (sample_rate: 0.1) | `01a019d3-8051-7955-8a78-a5631803ac37` |
| `conversations` | `ticket` | Enabled (dormant until channel connected) | `01a019d3-81e5-76b9-b3bc-09cc1b3179af` |
| `signals_scout` | `cross_source_issue` | ON BY DEFAULT — no row needed | — |
| `replay_vision` | — | Self-authorizing via `emits_signals` on scanners — no row needed | — |

---

## Connected tools

No external tools were selected. All connected-tool sources are unused.

---

## Scout troop

**Run budget:** 100 runs/day (early-access default, confirmed by `scout-metadata-get`). 0 runs used today.
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (7 scouts)

| Scout | Type | Reason enabled |
|---|---|---|
| `signals-scout-general` | Built-in | Always on — watches cross-product correlations and surfaces no specialist covers |
| `signals-scout-web-analytics` | Built-in | Consumer web product; session volume, channel attribution, and landing-page health matter |
| `signals-scout-product-analytics` | Built-in | Core conversion funnel; will watch saved funnels and flows as they're created |
| `signals-scout-web-vitals` | Built-in | Core Web Vitals affect both UX and SEO ranking for a file converter |
| `signals-scout-health-checks` | Built-in | Fresh PostHog setup; instrumentation health monitoring is especially valuable early |
| `signals-scout-conversion-funnel` | **Custom** | Watches the `file_selected` → `conversion_started` → `conversion_completed` → `file_downloaded` event funnel directly — the built-in product-analytics scout watches saved funnels, which don't exist yet on a fresh project |
| `signals-scout-auth-flow` | **Custom** | Watches `user_signed_up` and `user_logged_in` for sign-up volume drops and email verification blocks — not covered by any built-in specialist |

### Disabled (22 scouts)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the native error_tracking signal source (step 4) |
| `signals-scout-session-replay` | Covered by the native session_replay signal source (step 4) |
| `signals-scout-feature-flags` | No feature flags in use |
| `signals-scout-experiments` | No A/B experiments in use |
| `signals-scout-surveys` | No surveys in use |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data |
| `signals-scout-ai-observability` | No AI/LLM usage |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-csp-violations` | No CSP reporting configured |
| `signals-scout-customer-analytics` | B2C product, no group/accounts analytics |
| `signals-scout-data-pipelines` | No CDP destinations, batch exports, or hog flows |
| `signals-scout-data-warehouse` | No data warehouse sources |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry |
| `signals-scout-conversations` | No support ticket data yet |
| `signals-scout-anomaly-detection` | Not needed while troop has good specialist coverage |
| `signals-scout-observability-gaps` | Enable later once dashboards/insights are created |
| `signals-scout-replay-vision` | No pre-existing scanners before this run; step 6c's new scanners need time to accumulate observations |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate yet |
| `signals-scout-insight-alerts` | No alerts configured |
| `signals-scout-mcp-tool-calls` | Not applicable |
| `signals-scout-tasks` | Not applicable |
| `signals-scout-skills-store` | Not applicable |

To enable any disabled specialist later, go to the inbox settings or ask Claude Code.

---

## Custom scouts

### signals-scout-conversion-funnel

- **Surface:** The end-to-end file conversion pipeline (`file_selected` → `conversion_started` → `conversion_completed` → `file_downloaded`)
- **Discriminator:** Conversion success rate (`conversion_completed / conversion_started`) dropping more than 15 pp below the 7-day prior average; OR a single `source_format` → `target_format` pair failing over 50% on ≥5 starts; OR download rate after completion falling below 50%
- **Why no built-in covers it:** `signals-scout-product-analytics` watches saved funnels — on a fresh project with no saved funnels, it has nothing to watch. This scout queries the raw event stream directly.
- **Surfaces considered and ruled out:** Generic anomaly detection (covered by `signals-scout-anomaly-detection` when enabled); error tracking (covered by native source)

### signals-scout-auth-flow

- **Surface:** Sign-up and login flow (`user_signed_up`, `user_logged_in`)
- **Discriminator:** Daily signup count dropping ≥50% below 7-day prior average for 2+ consecutive days without a proportional traffic drop; OR `has_session: false` fraction on signups exceeding 85% for 3+ consecutive days (email verification blocking users)
- **Why no built-in covers it:** Neither `signals-scout-web-analytics` nor `signals-scout-general` specifically watches the auth event stream for verification-gate signals. The `has_session` property on `user_signed_up` is a Convertix-specific signal no built-in scout knows about.
- **Surfaces considered and ruled out:** Format-pair failure analysis (folded into the conversion funnel scout)

**Noise escape hatch:** If either custom scout turns out noisy, set `emit: false` on its config in PostHog (inbox settings) to switch it to dry-run. It continues running and logging without writing to the inbox.

---

## Replay Vision scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push findings directly into the Self-driving inbox. Each observation lands at half weight; a finding needs corroboration before it's promoted into a full report. The scanners are the only part of this setup that spends Replay Vision quota.

The `creating-replay-vision-scanners` skill was not available on this deploy, so credit spend was not verified. Both scanners use deliberately scoped queries at `sampling_rate ≤ 1`, so projected spend is minimal.

| Scanner | Status | Query scope | Sampling | Credits/observation | Est. monthly credits |
|---|---|---|---|---|---|
| Broken experiences | **Created** | Sessions where `$current_url` icontains `/convert` | 50% | 2 | 0 (no recordings yet) |
| User frustration | **Created** | Sessions with `$rageclick` events (all URLs) | 100% | 2 | 0 (no recordings yet) |

**Broken experiences** targets `/convert/` pages because that is where high-intent users land for specific format conversions (`/convert/docx-to-pdf` etc.) — the completion flow for Convertix. Silent breakage here (a spinner that never resolves, a download button that does nothing) directly loses the conversion. The main `/` page also hosts the converter but is excluded to keep the query tight and the two scanners disjoint.

**User frustration** is gated on `$rageclick` only — no URL scope — so the two scanners cannot match the same session via the same filter axis.

The project has existing recordings. Both scanners are enabled and will start watching new sessions immediately.

---

## Follow-ups

- [ ] **Enable Session Replay** manually: PostHog → Settings → Session replay → "Record user sessions"
- [ ] **Enable Error Tracking** manually: PostHog → Settings → Error tracking → "Enable exception autocapture"
- [ ] **Enable Support (Conversations)** manually: PostHog → Support product in sidebar
- [ ] **Connect a Support inbound channel** (email / inbox / Slack) in PostHog so the `conversations / ticket` source receives data
- [ ] **Connect external tools** if needed: GitHub Issues, Linear, Jira, or others can be added from [pipeline settings](https://eu.posthog.com/project/252531/pipeline/new/source)

---

## What happens next

The scout coordinator picks up fresh configs within ~30 minutes. Each enabled scout runs once per day by default, drawing from the 100-run daily budget. Findings cluster into reports in the [Self-driving inbox](https://eu.posthog.com/project/252531/inbox); immediately-actionable ones can automatically start coding tasks. The Replay Vision scanners sweep matching recordings every 5 minutes and push findings to the same inbox.
