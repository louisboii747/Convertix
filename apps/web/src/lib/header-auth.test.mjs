import assert from "node:assert/strict";
import test from "node:test";

import { parseAuthSummary, signedOutSummary } from "./header-auth.mjs";

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

test("falls back safely when the auth contract is malformed", () => {
  assert.deepEqual(parseAuthSummary(null), signedOutSummary);
  assert.deepEqual(
    parseAuthSummary({ authenticated: "yes", accountLabel: "Account" }),
    signedOutSummary,
  );
  assert.deepEqual(
    parseAuthSummary({ authenticated: true, accountLabel: "" }),
    signedOutSummary,
  );
  assert.deepEqual(
    parseAuthSummary({ authenticated: false, accountLabel: "Private name" }),
    signedOutSummary,
  );
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
