import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import test from "node:test";
import { chromium, type Page } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const base = process.env.ACCOUNT_TEST_SITE_URL ?? "http://localhost:3000";
const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (
  ![base, api].every((value) =>
    ["127.0.0.1", "localhost"].includes(new URL(value).hostname),
  )
)
  throw new Error(
    "Browser tests require local Convertix and Supabase instances.",
  );
const admin = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const output = "test-results/account-v2";

async function textAppears(page: Page, text: string) {
  await page.getByText(text, { exact: true }).waitFor();
}
async function noOverflow(page: Page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    "page must not overflow horizontally",
  );
}
async function recoveryEmail(email: string, subject: string) {
  const mailbox =
    process.env.ACCOUNT_TEST_MAILPIT_URL ?? "http://127.0.0.1:54324";
  if (!["127.0.0.1", "localhost"].includes(new URL(mailbox).hostname))
    throw new Error("Test mailbox must be local.");
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await fetch(`${mailbox}/api/v1/messages`).then((response) =>
      response.json(),
    );
    const message = list.messages.find(
      (entry: { To: { Address: string }[]; Subject: string }) =>
        entry.To.some((to) => to.Address === email) &&
        entry.Subject.toLowerCase().includes(subject),
    );
    if (message) {
      const detail = await fetch(
        `${mailbox}/api/v1/message/${message.ID}`,
      ).then((response) => response.json());
      const link = detail.HTML.match(/href="([^"]+)"/);
      assert.ok(link, "email must contain a verification link");
      return link[1].replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Expected local verification email did not arrive.");
}

test("Account v2 real browser workflows", { timeout: 180000 }, async () => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.ACCOUNT_TEST_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `browser-${randomUUID()}@example.test`;
  let currentEmail = email;
  let password = `Browser-v2-${randomUUID()}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Alex Morgan" },
  });
  assert.equal(created.error, null);
  const userId = created.data.user!.id;
  const rows = Array.from({ length: 32 }, (_, index) => ({
    id: randomUUID(),
    user_id: userId,
    conversion_id: randomUUID(),
    original_filename:
      index === 0
        ? "Quarterly report.docx"
        : `Presentation notes ${index}.docx`,
    source_format: "docx",
    target_format: "pdf",
    status: index === 1 ? "failed" : "completed",
    input_size: 21504,
    output_size: 168960,
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
  }));
  assert.equal(
    (await admin.from("conversion_history").insert(rows)).error,
    null,
  );
  try {
    for (const route of ["/account", "/account/history", "/account/settings"]) {
      await page.goto(`${base}${route}`);
      await page.waitForURL(`${base}/login`);
    }
    const anonymous = await context.request.post(
      `${base}/api/conversion-history`,
      { data: {} },
    );
    assert.deepEqual(await anonymous.json(), { saved: false });
    console.log(
      "PASS: unauthenticated account redirects and anonymous history is optional",
    );
    await page.getByRole("button", { name: "Decline analytics" }).click();
    await page.getByLabel("Email", { exact: true }).fill(currentEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(`${base}/account`);
    await page.getByRole("heading", { name: "Hello, Alex Morgan" }).waitFor();
    await textAppears(page, "32");
    assert.equal(
      await page
        .getByRole("link", { name: "Convert again" })
        .first()
        .getAttribute("href"),
      "/docx-to-pdf",
    );
    await noOverflow(page);
    await page.screenshot({
      path: `${output}/overview-desktop-light.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.screenshot({
      path: `${output}/overview-desktop-dark.png`,
      fullPage: true,
    });
    console.log(
      "PASS: real email/password login, overview totals and repeat routing",
    );

    const crossOrigin = await context.request.post(
      `${base}/api/conversion-history`,
      {
        headers: { Origin: "https://untrusted.example" },
        data: {},
      },
    );
    assert.equal(crossOrigin.status(), 403);
    const malformed = await context.request.post(
      `${base}/api/conversion-history`,
      { data: {} },
    );
    assert.equal(malformed.status(), 400);
    const oversized = await context.request.post(
      `${base}/api/conversion-history`,
      {
        data: { original_filename: "x".repeat(17000) },
      },
    );
    assert.equal(oversized.status(), 413);
    const written = await context.request.post(
      `${base}/api/conversion-history`,
      {
        data: {
          ...rows[0],
          user_id: randomUUID(),
          status: "failed",
          output_key: "untrusted-storage-key",
        },
      },
    );
    assert.equal(written.status(), 200);
    const saved = await admin
      .from("conversion_history")
      .select("user_id,status,output_key")
      .eq("id", rows[0].id)
      .single();
    assert.equal(saved.data?.user_id, userId);
    assert.equal(saved.data?.status, "completed");
    assert.equal(saved.data?.output_key, null);
    console.log(
      "PASS: authenticated history API rejects cross-origin/invalid/oversized writes and ignores forged ownership/storage keys",
    );

    await page
      .getByRole("navigation", { name: "Account navigation" })
      .getByRole("link", { name: "History" })
      .click();
    await page.getByText("Page 1 of 3", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await textAppears(page, "Page 2 of 3");
    await page.getByLabel("Filename", { exact: true }).fill("Quarterly report");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await textAppears(page, "1 conversion found");
    assert.equal(
      new URL(page.url()).search,
      "",
      "search terms must not enter URLs",
    );
    await page
      .getByRole("button", {
        name: "Delete history entry for Quarterly report.docx",
      })
      .click();
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Keep entry",
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page
      .getByRole("button", {
        name: "Delete history entry for Quarterly report.docx",
      })
      .click();
    await page
      .getByRole("button", { name: "Delete entry", exact: true })
      .click();
    await textAppears(page, "History entry deleted.");
    assert.deepEqual(
      (await admin.from("conversion_history").select("id").eq("id", rows[0].id))
        .data,
      [],
    );
    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await textAppears(page, "31 conversions recorded");
    await page.getByLabel("Status", { exact: true }).selectOption("failed");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await textAppears(page, "1 conversion found");
    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await textAppears(page, "31 conversions recorded");
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
    await page.screenshot({
      path: `${output}/history-mobile-dark.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.screenshot({
      path: `${output}/history-mobile-light.png`,
      fullPage: true,
    });
    console.log(
      "PASS: pagination, search, status filter, confirmation focus/Escape and actual history deletion",
    );

    await page
      .getByRole("navigation", { name: "Account navigation" })
      .getByRole("link", { name: "Settings" })
      .click();
    await page.getByLabel("Display name", { exact: true }).fill("Alex Updated");
    await page.getByRole("button", { name: "Save display name" }).click();
    await textAppears(page, "Display name saved.");
    assert.equal(
      (await context.request.get(`${base}/api/auth/header`)).status(),
      200,
    );
    assert.equal(
      (await (await context.request.get(`${base}/api/auth/header`)).json())
        .accountLabel,
      "Alex Updated",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Alex Updated" })
      .waitFor();
    await page
      .getByLabel("Current password", { exact: true })
      .fill("wrong-password");
    await page
      .getByLabel("New password", { exact: true })
      .fill(`${password}-changed`);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(`${password}-changed`);
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "We couldn’t change your password" })
      .waitFor();
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page
      .getByLabel("New password", { exact: true })
      .fill(`${password}-changed`);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(`${password}-changed`);
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await textAppears(
      page,
      "Password changed. Use your new password next time you log in.",
    );
    password += "-changed";
    await noOverflow(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `${output}/settings-desktop-light.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 740 });
    await noOverflow(page);
    await page.screenshot({
      path: `${output}/settings-mobile-light.png`,
      fullPage: true,
    });
    console.log(
      "PASS: profile update refreshes the header, password validation and real password change, responsive settings",
    );

    const changedEmail = `changed-${randomUUID()}@example.test`;
    await page
      .getByLabel("New email address", { exact: true })
      .fill(changedEmail);
    await page.getByRole("button", { name: "Request email change" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Check your current and new email inboxes" })
      .waitFor();
    let authUser = (await admin.auth.admin.getUserById(userId)).data.user!;
    assert.equal(authUser.email, currentEmail);
    assert.equal(authUser.new_email, changedEmail);
    const oldLink = await recoveryEmail(currentEmail, "email");
    const newLink = await recoveryEmail(changedEmail, "email");
    assert.ok(
      oldLink !== newLink,
      "secure email change must send distinct verification links",
    );
    await page.goto(oldLink);
    assert.equal(
      (await admin.auth.admin.getUserById(userId)).data.user?.email,
      currentEmail,
      "old-email confirmation alone must not finish the change",
    );
    await page.goto(newLink);
    await page.waitForURL(/\/account\/settings/);
    authUser = (await admin.auth.admin.getUserById(userId)).data.user!;
    assert.equal(authUser.email, changedEmail);
    currentEmail = changedEmail;
    console.log(
      "PASS: email change stays pending until both real verification links are confirmed",
    );

    await page.goto(`${base}/forgot-password`);
    await page.getByLabel("Email address", { exact: true }).fill(currentEmail);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "If an account exists" })
      .waitFor();
    const resetLink = await recoveryEmail(currentEmail, "password");
    await page.goto(resetLink);
    await page.waitForURL(`${base}/reset-password`);
    await page
      .getByLabel("New password", { exact: true })
      .fill(`${password}-recovered`);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(`${password}-recovered`);
    await page.getByRole("button", { name: "Save new password" }).click();
    await page.waitForURL(`${base}/login?success=password_reset`);
    await textAppears(page, "Password updated. Log in with your new password.");
    password += "-recovered";
    console.log(
      "PASS: forgotten password, emailed PKCE callback, reset form and success redirect",
    );

    await page.getByLabel("Email", { exact: true }).fill(currentEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(`${base}/account`);
    await page.goto(`${base}/account/settings`);
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: "Delete account…", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(
      await dialog
        .getByRole("button", { name: "Delete my account", exact: true })
        .isDisabled(),
      true,
    );
    await dialog.getByLabel("Type DELETE to confirm").fill("delete");
    assert.equal(
      await dialog
        .getByRole("button", { name: "Delete my account", exact: true })
        .isDisabled(),
      true,
    );
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
    await dialog
      .getByRole("button", { name: "Delete my account", exact: true })
      .click();
    await page.waitForURL(`${base}/login?success=account_deleted`);
    assert.equal((await admin.auth.admin.getUserById(userId)).data.user, null);
    assert.deepEqual(
      (
        await admin
          .from("conversion_history")
          .select("id")
          .eq("user_id", userId)
      ).data,
      [],
    );
    await page.goto(`${base}/account/history`);
    await page.waitForURL(`${base}/login`);
    assert.deepEqual(errors, [], "no browser runtime errors");
    console.log(
      "PASS: deliberate account deletion, server-side cascade, signout and protected routes",
    );
  } catch (error) {
    await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
    console.error("Browser failure at", new URL(page.url()).pathname, errors);
    throw error;
  } finally {
    await admin.auth.admin.deleteUser(userId);
    await context.close();
    await browser.close();
  }
});

test(
  "Signup confirmation establishes an account through the existing PKCE callback",
  { timeout: 60000 },
  async () => {
    const browser = await chromium.launch({
      channel: process.env.ACCOUNT_TEST_BROWSER_CHANNEL ?? "chrome",
      headless: true,
    });
    const page = await browser.newPage();
    const email = `signup-${randomUUID()}@example.test`;
    const password = `Signup-v2-${randomUUID()}`;
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let userId: string | undefined;
    try {
      await page.goto(`${base}/signup`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Decline analytics" }).click();
      await page
        .getByLabel("Display name", { exact: true })
        .fill("Sam Newcomer");
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Create account", exact: true })
        .click();
      await page.waitForURL(`${base}/signup?success=check_email`);
      const users = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId = users.data.users.find((user) => user.email === email)?.id;
      assert.ok(userId);
      assert.equal(
        (await admin.auth.admin.getUserById(userId)).data.user
          ?.email_confirmed_at,
        undefined,
      );
      const link = await recoveryEmail(email, "confirm your email");
      await page.goto(link);
      await page.waitForURL(`${base}/account`);
      await page
        .getByRole("heading", { name: "Hello, Sam Newcomer" })
        .waitFor();
      assert.ok(
        (await admin.auth.admin.getUserById(userId)).data.user
          ?.email_confirmed_at,
      );
      await page
        .getByRole("heading", { name: "Your next conversion starts here" })
        .waitFor();
      await page.goto(`${base}/reset-password`);
      await page.getByRole("heading", { name: /get a fresh link/ }).waitFor();
      assert.deepEqual(errors, []);
      console.log(
        "PASS: real signup, email confirmation, profile trigger, empty account, and reset-page session guard",
      );
    } finally {
      if (!userId) {
        const users = await admin.auth.admin.listUsers({ perPage: 1000 });
        userId = users.data.users.find((user) => user.email === email)?.id;
      }
      if (userId) await admin.auth.admin.deleteUser(userId);
      await browser.close();
    }
  },
);
