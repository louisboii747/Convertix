import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchAuthSummary,
  parseAuthSummary,
  signedOutSummary,
} from "./header-auth.mjs";

test("accepts the public signed-in header contract", () => {
  assert.deepEqual(
    parseAuthSummary({
      authenticated: true,
      accountLabel: "Test account",
    }),
    {
      authenticated: true,
      accountLabel: "Test account",
    },
  );
});

test("distinguishes an unavailable check from a confirmed sign-out", () => {
  assert.equal(parseAuthSummary(null), null);
  assert.deepEqual(
    parseAuthSummary({ authenticated: "yes", accountLabel: "Account" }),
    null,
  );
  assert.deepEqual(
    parseAuthSummary({ authenticated: true, accountLabel: "" }),
    null,
  );
  assert.deepEqual(
    parseAuthSummary({ authenticated: false, accountLabel: "Private name" }),
    signedOutSummary,
  );
});

test("HTTP, network and malformed JSON failures do not sign the user out", async () => {
  for (const fetcher of [
    async () => new Response("Unavailable", { status: 503 }),
    async () => new Response("<html>Error</html>"),
    async () => new Response(JSON.stringify({ authenticated: "false" })),
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => {
      throw new DOMException("Aborted", "AbortError");
    },
  ]) {
    assert.equal(await fetchAuthSummary(undefined, fetcher), null);
  }
});

test("fetches an uncached, same-origin summary and accepts explicit sign-out", async () => {
  const controller = new AbortController();
  const summary = await fetchAuthSummary(
    controller.signal,
    async (url, options) => {
      assert.equal(url, "/api/auth/header");
      assert.equal(options.cache, "no-store");
      assert.equal(options.credentials, "same-origin");
      assert.equal(options.signal, controller.signal);
      return Response.json(signedOutSummary);
    },
  );
  assert.deepEqual(summary, signedOutSummary);
});

test("keeps private fields out of the client auth state", () => {
  assert.deepEqual(
    parseAuthSummary({
      authenticated: true,
      accountLabel: "  Test account  ",
      email: "private@example.com",
      userId: "private-user-id",
    }),
    {
      authenticated: true,
      accountLabel: "Test account",
    },
  );
});
