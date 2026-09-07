import assert from "node:assert/strict";
import test from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_HISTORY_FILTERS,
  accountCallbackDestination,
  escapeLike,
  formatFileSize,
  getRepeatConversionHref,
  isSameOriginRequest,
  parseHistoryFilters,
  parseHistoryWrite,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from "./account.ts";
import {
  authenticatedAccount,
  changeOwnPassword,
  deleteOwnAccount,
  deleteOwnHistory,
  queryOwnHistory,
  updateOwnProfile,
} from "./account-queries.ts";
import { protectAnalyticsEvent } from "./analytics-privacy.ts";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

function clientFixture(response: unknown = []) {
  const requests: { url: URL; init?: RequestInit }[] = [];
  const client = createClient(
    "http://localhost:54321",
    "test-publishable-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (input, init) => {
          requests.push({ url: new URL(String(input)), init });
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json",
              "Content-Range": "0-14/31",
            },
          });
        },
      },
    },
  );
  Object.assign(client.auth, {
    getUser: async () => ({ data: { user: { id: owner } }, error: null }),
  });
  return { client, requests };
}

test("password changes use verified account credentials and route OAuth-only users to email recovery", async () => {
  const { client } = clientFixture();
  const user = {
    id: owner,
    email: "owner@example.test",
    identities: [{ provider: "google" }],
  };
  const steps: unknown[] = [];
  Object.assign(client.auth, {
    getUser: async () => ({ data: { user }, error: null }),
    signInWithPassword: async (credentials: unknown) => {
      steps.push(credentials);
      return { data: { user }, error: null };
    },
    updateUser: async (attributes: unknown) => {
      steps.push(attributes);
      return { error: null };
    },
  });
  await assert.rejects(
    () =>
      changeOwnPassword(
        client,
        "current-password",
        "next-password",
        "next-password",
      ),
    /email reset link/,
  );
  assert.deepEqual(steps, []);
  user.identities.push({ provider: "email" });
  await changeOwnPassword(
    client,
    "current-password",
    "next-password",
    "next-password",
  );
  assert.deepEqual(steps, [
    { email: user.email, password: "current-password" },
    { password: "next-password", current_password: "current-password" },
  ]);
});

test("history validates search, formats, status and bounded integer pagination", () => {
  assert.deepEqual(parseHistoryFilters({}), EMPTY_HISTORY_FILTERS);
  assert.equal(
    parseHistoryFilters({ search: " report.pdf ", page: 3 }).search,
    "report.pdf",
  );
  for (const input of [
    null,
    [],
    { page: 0 },
    { page: 1.2 },
    { page: "2" },
    { page: 100001 },
    { search: "a".repeat(121) },
    { search: "*" },
    { source: "__proto__" },
    { source: "bad" },
    { target: "https://evil.test" },
    { status: "deleted" },
  ])
    assert.throws(() => parseHistoryFilters(input));
  assert.equal(escapeLike("50%_report\\file"), "50\\%\\_report\\\\file");
});

test("Convert again uses only enabled canonical routes and handles JPEG aliases", () => {
  assert.equal(getRepeatConversionHref("docx", "pdf"), "/docx-to-pdf");
  assert.equal(getRepeatConversionHref("JPEG", "PNG"), "/jpg-to-png");
  assert.equal(getRepeatConversionHref("heic", "webp"), "/heic-to-webp");
  assert.equal(getRepeatConversionHref("pdf", "docx"), null);
  assert.equal(getRepeatConversionHref("//evil.test", "pdf"), null);
});

test("profile, email, password and size validation rejects malformed input", () => {
  assert.equal(validateDisplayName("  Alex  "), "Alex");
  for (const name of [null, "", " ", "x".repeat(81), "a\nb"])
    assert.throws(() => validateDisplayName(name));
  assert.equal(validateEmail(" me@example.test "), "me@example.test");
  assert.throws(() => validateEmail("not-an-email"));
  assert.throws(() => validatePassword("short", "short"));
  assert.throws(() => validatePassword("valid-password", "different"));
  assert.equal(formatFileSize(null), "Not recorded");
  assert.equal(formatFileSize(0), "0 B");
  assert.equal(formatFileSize(1024), "1 KB");
});

test("history writes ignore supplied ownership and storage keys and validate sizes", () => {
  const valid = {
    conversion_id: owner,
    original_filename: "report.docx",
    source_format: "docx",
    target_format: "pdf",
  };
  const parsed = parseHistoryWrite({
    ...valid,
    user_id: other,
    status: "failed",
    output_key: "private/key",
    input_size: 0,
  });
  assert.equal(parsed.input_size, 0);
  assert.equal(parsed.output_size, null);
  assert.ok(
    !("user_id" in parsed) &&
      !("output_key" in parsed) &&
      !("status" in parsed),
  );
  for (const change of [
    { conversion_id: "invalid" },
    { original_filename: "\u0000bad" },
    { source_format: "__proto__" },
    { input_size: -1 },
    { output_size: "10" },
    { input_size: 1.4 },
  ])
    assert.throws(() => parseHistoryWrite({ ...valid, ...change }));
});

test("history requests enforce authenticated ownership and combine all filters before pagination", async () => {
  const { client, requests } = clientFixture();
  const result = await queryOwnHistory(client, {
    search: "50%_report",
    source: "docx",
    target: "pdf",
    status: "completed",
    page: 2,
    user_id: other,
  });
  const query = requests[0].url.searchParams;
  assert.equal(query.get("user_id"), `eq.${owner}`);
  assert.equal(query.get("original_filename"), "ilike.%50\\%\\_report%");
  assert.equal(query.get("source_format"), "eq.docx");
  assert.equal(query.get("target_format"), "eq.pdf");
  assert.equal(query.get("status"), "eq.completed");
  assert.equal(query.get("offset"), "15");
  assert.equal(query.get("limit"), "15");
  assert.equal(query.get("order"), "created_at.desc,id.desc");
  assert.ok(!query.get("select")?.includes("output_key"));
  assert.equal(result.count, 31);
});

test("unauthenticated, anonymous and invalid sessions never query account data", async () => {
  for (const user of [null, { id: owner, is_anonymous: true }]) {
    const { client, requests } = clientFixture();
    Object.assign(client.auth, {
      getUser: async () => ({ data: { user }, error: null }),
    });
    await assert.rejects(() => authenticatedAccount(client), /log in/);
    await assert.rejects(() => queryOwnHistory(client, {}), /log in/);
    await assert.rejects(
      () => deleteOwnHistory(client, other, "DELETE"),
      /log in/,
    );
    assert.equal(requests.length, 0);
  }
});

test("history deletion requires confirmation and scopes id to the session owner", async () => {
  const { client, requests } = clientFixture({ id: other });
  await assert.rejects(() => deleteOwnHistory(client, other, ""));
  assert.equal(requests.length, 0);
  await deleteOwnHistory(client, other, "DELETE");
  assert.equal(requests[0].init?.method, "DELETE");
  assert.equal(requests[0].url.searchParams.get("user_id"), `eq.${owner}`);
  assert.equal(requests[0].url.searchParams.get("id"), `eq.${other}`);
  const missing = clientFixture(null);
  await assert.rejects(
    () => deleteOwnHistory(missing.client, other, "DELETE"),
    /no longer available/,
  );
});

test("profile update writes only the signed-in profile and validated fields", async () => {
  const { client, requests } = clientFixture({ id: owner });
  await updateOwnProfile(client, " New name ");
  assert.equal(requests[0].url.searchParams.get("id"), `eq.${owner}`);
  const body = JSON.parse(String(requests[0].init?.body));
  assert.deepEqual(Object.keys(body).sort(), ["display_name", "updated_at"]);
  assert.equal(body.display_name, "New name");
});

test("account deletion authorizes before admin access and revokes sessions before deleting only self", async () => {
  const calls: string[] = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: owner } }, error: null }),
      getSession: async () => ({
        data: {
          session: {
            user: { id: owner },
            access_token: "verified-session-token",
          },
        },
        error: null,
      }),
      signOut: async () => {
        calls.push("local signout");
        return { error: null };
      },
    },
  } as unknown as SupabaseClient;
  const admin = {
    auth: {
      admin: {
        signOut: async (token: string, scope: string) => {
          assert.equal(token, "verified-session-token");
          assert.equal(scope, "global");
          calls.push("revoke");
          return { error: null };
        },
        deleteUser: async (id: string) => {
          assert.equal(id, owner);
          calls.push("delete self");
          return { error: null };
        },
      },
    },
  } as unknown as SupabaseClient;
  const getAdmin = () => {
    calls.push("admin created");
    return admin;
  };
  await assert.rejects(() => deleteOwnAccount(client, getAdmin, "delete"));
  assert.deepEqual(calls, []);
  await deleteOwnAccount(client, getAdmin, "DELETE");
  assert.deepEqual(calls, [
    "admin created",
    "revoke",
    "delete self",
    "local signout",
  ]);
  calls.length = 0;
  Object.assign(client.auth, {
    getUser: async () => ({ data: { user: null }, error: null }),
  });
  await assert.rejects(() => deleteOwnAccount(client, getAdmin, "DELETE"));
  assert.deepEqual(calls, []);
});

test("unavailable admin configuration and failed session revocation prevent account deletion", async () => {
  const { client } = clientFixture();
  await assert.rejects(
    () =>
      deleteOwnAccount(
        client,
        () => {
          throw new Error("not configured");
        },
        "DELETE",
      ),
    /not configured/,
  );
  Object.assign(client.auth, {
    getSession: async () => ({
      data: { session: { user: { id: owner }, access_token: "token" } },
      error: null,
    }),
  });
  let deleted = false;
  const admin = {
    auth: {
      admin: {
        signOut: async () => ({ error: new Error("failed") }),
        deleteUser: async () => {
          deleted = true;
        },
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    () => deleteOwnAccount(client, () => admin, "DELETE"),
    /not been deleted/,
  );
  assert.equal(deleted, false);
});

test("callback destinations cannot become open redirects and API rejects cross-site writes", () => {
  assert.equal(accountCallbackDestination("recovery"), "/reset-password");
  assert.equal(
    accountCallbackDestination("email"),
    "/account/settings?email=verified",
  );
  for (const input of [
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "recovery?next=evil",
  ])
    assert.equal(accountCallbackDestination(input), "/account");
  assert.ok(
    isSameOriginRequest(
      new Request("https://convertix.uk/api/conversion-history", {
        headers: { Origin: "https://convertix.uk" },
      }),
    ),
  );
  assert.ok(
    !isSameOriginRequest(
      new Request("https://convertix.uk/api/conversion-history", {
        headers: { Origin: "https://evil.test" },
      }),
    ),
  );
});

test("private analytics drop automatic capture and sensitive event properties", () => {
  assert.equal(
    protectAnalyticsEvent(
      {
        event: "$pageview",
        properties: {
          $current_url: "https://convertix.uk/auth/callback?code=secret",
        },
      },
      "/auth/callback",
    ),
    null,
  );
  assert.equal(
    protectAnalyticsEvent(
      { event: "$snapshot", properties: { filename: "secret.pdf" } },
      "/account/history",
    ),
    null,
  );
  const result = protectAnalyticsEvent(
    {
      event: "account_history_searched",
      $set_once: {
        $initial_current_url: "https://convertix.uk/auth/callback?code=secret",
      },
      $set: { email: "private@example.test" },
      properties: {
        token: "public-posthog-project-token",
        distinct_id: "anonymous-id",
        filename: "secret.pdf",
        email: "private@example.test",
        password: "secret",
        $current_url: "https://convertix.uk/account?search=private",
      },
    },
    "/account/history",
  );
  assert.deepEqual(result?.properties, {
    token: "public-posthog-project-token",
    distinct_id: "anonymous-id",
  });
  assert.equal(result?.$set_once, undefined);
  assert.equal(result?.$set, undefined);
  assert.deepEqual(
    protectAnalyticsEvent(
      {
        event: "conversion_started",
        properties: {},
        $set_once: {
          $initial_current_url:
            "https://convertix.uk/auth/callback?code=secret",
          $initial_utm_source: "campaign",
        },
      },
      "/docx-to-pdf",
    )?.$set_once,
    {
      $initial_current_url: "https://convertix.uk/auth/callback",
      $initial_utm_source: "campaign",
    },
  );
  assert.equal(
    protectAnalyticsEvent(
      {
        event: "conversion_started",
        properties: {
          $referrer: "https://convertix.uk/auth/callback?code=secret",
          source_format: "docx",
        },
      },
      "/docx-to-pdf",
    )?.properties.$referrer,
    "https://convertix.uk/auth/callback",
  );
});
