# Account v2

Account v2 uses the existing Next.js App Router, Supabase SSR cookies, `profiles`, `conversion_history`, and Convertix theme tokens. `/account`, `/account/history`, and `/account/settings` share a responsive account layout. Public conversion routes, acquisition experiments, metadata, canonicals, structured data, and intentional internal links are unchanged.

## Deploy in this order

1. Apply `supabase/migrations/20260907144502_account_v2.sql` through the normal Supabase migration process, before deploying the web app. It preserves production rows, restores the previously untracked profile-table baseline for fresh installs, establishes explicit grants/cascades, replaces the history ordering index, and adds the invoker-rights summary function. Review the migration preview against the intended project before applying. Do not replay older migrations already present in the hosted migration ledger.
2. Configure the web deployment using `apps/web/.env.example`. Existing required public values are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the correct HTTPS `NEXT_PUBLIC_CONVERTIX_SITE_URL`. **New server-only value: `SUPABASE_SERVICE_ROLE_KEY`**, accepting a service-role JWT or Supabase secret key. Never use a `NEXT_PUBLIC_` prefix. The server checks the key's role/prefix and URL shape; Auth verifies the actual credential when deleting a user. Missing/invalid configuration disables the delete-account control and gives a support link; other account features and conversion remain available.
3. In Supabase Auth, keep **Confirm email** and **Secure email change** enabled. Secure email change needs email confirmations enabled to require both inboxes. The local config now models this. Review password policy/rate limits and production SMTP delivery. The hosted security advisor currently reports **Leaked Password Protection Disabled**; enable it where supported: [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
4. Preserve existing Google OAuth credentials/provider configuration and callback allowlist entries. Allow the following URLs for each approved deployment origin (shown for production): `https://convertix.uk/auth/callback`, `https://convertix.uk/auth/callback?flow=signup`, `https://convertix.uk/auth/callback?flow=recovery`, and `https://convertix.uk/auth/callback?flow=email`. If the installed Supabase SDK adds `sb_flow_id`, allow the query-string variants at this exact callback path (for example `https://convertix.uk/auth/callback?*`), rather than a wildcard domain. Keep old `/login?verified=true` entries while previously issued signup links may still be in circulation.
5. Use Supabase email templates based on `{{ .ConfirmationURL }}` for signup, recovery, and email change. No custom token-hash confirmation endpoint was added. PKCE email links must be opened in the browser that requested them; expired, reused, or cross-browser links get a recovery/error state. The first secure email-change confirmation can return without a code; settings reads the actual pending email from Auth.
6. Deploy the frontend, then smoke-test production Google OAuth, signup confirmation, password recovery, both email-change confirmations, and account deletion with a disposable account. These tests must use the deployed callback origin and configured SMTP provider. Check analytics with both accepted and rejected consent.

This implementation was validated locally. No hosted migration, Auth configuration, credential, or deployment was changed.

## Data and behavior

- Total conversions and this month count saved history rows, not a latest-20 sample. Month boundaries are UTC. Deleted entries reduce totals. Anonymous conversions and failed/unrecorded attempts are not retroactively recovered. These are account-history statistics, not a billing or independently verified conversion ledger.
- A most-used pair appears after at least three completed records, with at least two uses of the leading pair and no tie for first place. Failed attempts do not determine the favourite. Unavailable statistics display a dash and an error state, never a fabricated zero.
- History loads 15 rows at a time, ordered by creation timestamp and ID. Filename search is case-insensitive literal substring search, limited to 120 characters; `%`, `_`, and backslashes are escaped. `*` is rejected because PostgREST aliases it to a wildcard. Format/status filters combine with the search and reset pagination. Search text stays in POST bodies, out of URLs and analytics.
- `Convert again` resolves only enabled existing routes through the shared format registry, including JPEG/JPG aliases. Unsupported historic pairs have no invented link. Users choose a fresh file.
- **No “Download again”**: stored history does not guarantee output retention. The account UI never receives output keys or signed download URLs, and new history writes no longer retain browser-supplied storage keys. The conversion response still supplies its normal immediate download separately.
- Profile updates write the signed-in user's profile and trigger the existing `/api/auth/header` fetch. Neither email nor display name is used for authorization.
- Password changes reauthenticate with `signInWithPassword` before `updateUser`, independently of whether Auth enforces `current_password`. They also pass `current_password` to support deployments that require it. OAuth-only accounts receive a secure email-link path for adding a Convertix password; their Google password/account is unchanged. Recovery requires a verified user plus a recent signed `recovery` or `otp` authentication claim, then uses `updateUser` and global sign-out.

## Security review

- Every account page obtains a server-verified user. Every action independently authenticates with `getUser`; the layout and client UI are not security boundaries. `getSession` is used only to retrieve a token after user verification during deletion.
- History reads/deletes include the authenticated user's ID as well as the row ID where applicable. Client-supplied ownership is ignored. Existing history RLS has owner predicates for SELECT/INSERT/UPDATE/DELETE, including UPDATE `WITH CHECK`. Profile SELECT/INSERT/UPDATE policies likewise enforce ownership.
- The migration removes unnecessary table grants, including `TRUNCATE`, which RLS does not protect. Profile updates cannot alter the primary key or member-since timestamp. Authenticated history access has only CRUD grants; anonymous access has none. The summary function is `SECURITY INVOKER` with a fixed search path and no user-ID argument. The necessary signup trigger is not executable as a public RPC.
- Account deletion requires the literal `DELETE` on the server, derives the target solely from the verified session, obtains the admin client only after those checks, revokes refresh sessions, then deletes the Auth user. Both profile/history foreign keys cascade in the database transaction. Local session cookies are cleared afterward. Repeated requests cannot target another user or reconstruct the deleted account.
- Supabase access JWTs can remain cryptographically valid until expiry after sign-out. Deleted users still fail `getUser`; cascades leave no owned rows to read, and Auth foreign keys prevent stale-token profile/history reinsertion. No claim is made that sign-out invalidates every issued access JWT immediately.
- Mutations use Next.js Server Actions' Origin/Host CSRF check and POST-only dispatch. The existing history API additionally rejects cross-origin/cross-site writes, limits bodies to 16 KiB, validates identifiers/formats/sizes, and exposes generic errors. Anonymous history writes return `{ saved: false }` without blocking conversion.
- Callback routing accepts only fixed flow destinations, never arbitrary `next` URLs. Auth callback responses are private/no-store with no-referrer. Account responses use request-bound cookies; no cross-user cache is introduced. Header/API responses are private/no-store.
- The admin client imports `server-only` and is never used for normal profile/history access. No credentials, filenames, email addresses, display names, passwords, storage keys, or auth error bodies are added to analytics. PostHog private-page automatic captures are dropped, private events use an allowlist of properties, account/auth DOM is blocked from replay, and header identity text is masked. Server auth events honor the consent cookie; optional dispatch runs after the response. Development Server Function argument logging is disabled to keep search filenames out of logs.
- Account deletion removes the Auth account, profile, and history, not downloaded files or an external Google account. Conversion-service temporary objects retain their independent existing lifecycle; no new storage-erasure or download-retention guarantee is introduced.

## Verification

From `apps/web`:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
```

Database tests use a disposable **local** Supabase stack. `supabase test db --local` runs the pgTAP checks. `supabase db lint --local --schema public --fail-on warning` checks the schema. The integration/browser suites refuse non-local database/site URLs and clean up their test users. Put only local Supabase credentials in the ignored `.env.local` when running them:

```powershell
npm.cmd run test:account:db
# Start Convertix on localhost:3000, then:
npm.cmd run test:account:browser
```

The browser suite uses installed Chrome by default; set `ACCOUNT_TEST_BROWSER_CHANNEL=msedge` for Edge. `ACCOUNT_TEST_SITE_URL` and `ACCOUNT_TEST_MAILPIT_URL` can override local ports. Playwright is pinned as a development-only dependency. Screenshots are written to ignored `apps/web/test-results/account-v2/`.

Coverage includes validation/redirect rules, anonymous access, owner-scoped queries/deletes, literal search and combined filters, pagination beyond 20 rows, summary counts, profile updates, reauthentication, single-use recovery tokens, secure email verification, deletion cascades/replay, server-side admin protections, analytics property filtering, real browser forms, desktop/mobile themes, keyboard confirmation focus, Escape, and horizontal overflow. Production Google OAuth/SMTP and delivery to the live PostHog project remain deployment smoke checks.

### Results on 7 September 2026

| Check | Result |
| --- | --- |
| `npm.cmd test` | Passed: ESLint, TypeScript, 3 existing auth tests, 4 existing format tests, 13 account tests |
| `npm.cmd run build` | Passed: optimized production build and static generation |
| `npm.cmd run test:account:db` | Passed: 9 integration scenarios, 10 Node test results including the parent |
| `supabase test db --local` | Passed: 16 pgTAP assertions |
| `supabase db lint --local --schema public --fail-on warning` | Passed: no schema errors |
| `npm.cmd run test:account:browser` against `next start` | Passed: both real browser workflows, including signup, secure email change, recovery and account deletion |
| Responsive/accessibility checks | Passed at 320, 390 and 1440 pixels, with light/dark screenshots, no horizontal overflow, initial confirmation focus and Escape handling |
| Final diff / browser bundle review | Passed: no whitespace errors; no protected public route changes; public CSS rules equivalent after obsolete account selectors are removed; no privileged test credential in browser assets |

Non-fatal tool warnings remain: Next.js detects the repository's existing multiple lockfiles, and Node reports module-type detection for direct TypeScript tests. Neither prevented validation. Local Supabase was tested with email confirmations and secure email change enabled; no live Google credentials, SMTP deliveries, or production PostHog event ingestion were exercised.
