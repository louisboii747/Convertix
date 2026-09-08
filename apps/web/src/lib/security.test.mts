import assert from "node:assert/strict";
import test from "node:test";
import {
  readJsonObject,
  parseContactMessage,
  serializeJsonLd,
} from "./request-security.ts";
import { parseSavedRoutes } from "./route-shortcuts.ts";
import { isUnavailableAuthError } from "./auth-status.ts";

const request = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://convertix.uk/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });

test("contact input rejects malformed JSON, non-objects and non-JSON requests", async () => {
  for (const value of ["null", "[]", '"hello"', "{", "true"])
    await assert.rejects(readJsonObject(request(value)), { status: 400 });
  await assert.rejects(
    readJsonObject(request("{}", { "Content-Type": "text/plain" })),
    { status: 415 },
  );
  assert.deepEqual(await readJsonObject(request('{"name":"Alex"}')), {
    name: "Alex",
  });
});

test("body limit counts received bytes even without an honest content-length", async () => {
  for (const headers of [{}, { "Content-Length": "2" }] as Record<
    string,
    string
  >[])
    await assert.rejects(
      readJsonObject(
        request(JSON.stringify({ message: "é".repeat(100) }), headers),
        128,
      ),
      { status: 413 },
    );
  await assert.rejects(
    readJsonObject(request("{}", { "Content-Length": "999999" })),
    { status: 413 },
  );
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(100));
      controller.enqueue(new Uint8Array(100));
      controller.close();
    },
  });
  const streamed = new Request("https://convertix.uk/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(readJsonObject(streamed, 128), { status: 413 });
});

test("contact validation blocks header injection while preserving plain-text messages", () => {
  const valid = {
    name: "Alex",
    email: "alex@example.test",
    subject: "A question",
    message: "Hello\nCan you help with <svg onload=alert(1)>?",
  };
  assert.deepEqual(parseContactMessage(valid), valid);
  for (const key of ["name", "email", "subject"])
    assert.throws(() =>
      parseContactMessage({
        ...valid,
        [key]: valid[key as keyof typeof valid] + "\r\nBcc: x@example.test",
      }),
    );
  for (const message of ["x".repeat(5001), "x\u0000y", [], null])
    assert.throws(() => parseContactMessage({ ...valid, message }));
});

test("JSON-LD cannot terminate its enclosing script element", () => {
  const value = {
    name: '</script><script>alert("xss")</script>',
    description: "<img src=x onerror=alert(1)>",
  };
  const encoded = serializeJsonLd(value);
  assert.equal(encoded.includes("<"), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test("browser shortcuts accept only known routes, deduplicate and bound stored data", () => {
  const allowed = new Set(["/png-to-jpg", "/docx-to-pdf"]);
  assert.deepEqual(
    parseSavedRoutes(
      JSON.stringify([
        "javascript:alert(1)",
        "//evil.test",
        "/account?token=x",
        "/png-to-jpg",
        "/png-to-jpg",
        {},
        "/docx-to-pdf",
      ]),
      allowed,
    ),
    [...allowed],
  );
  for (const value of ["{", "null", '"/png-to-jpg"', "x".repeat(4097)])
    assert.deepEqual(parseSavedRoutes(value, allowed), []);
  assert.deepEqual(parseSavedRoutes(JSON.stringify([...allowed]), allowed, 1), [
    "/png-to-jpg",
  ]);
});

test("authentication outages are distinct from missing or invalid sessions", () => {
  for (const error of [
    { status: 503 },
    { status: 429 },
    { name: "AuthRetryableFetchError", status: 0 },
  ])
    assert.equal(isUnavailableAuthError(error), true);
  for (const error of [
    null,
    { name: "AuthSessionMissingError", status: 400 },
    { status: 401 },
    { status: 403 },
  ])
    assert.equal(isUnavailableAuthError(error), false);
});
