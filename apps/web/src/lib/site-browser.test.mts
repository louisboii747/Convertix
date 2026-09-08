import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
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
    "Site regression tests require local Convertix and Supabase.",
  );
const admin = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const output = "test-results/site-audit";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function noOverflow(page: Page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    "page must fit the viewport",
  );
}
async function labelIs(page: Page, label: string) {
  await page.waitForFunction(
    (expected) =>
      document.querySelector(".site-auth-link")?.textContent === expected,
    label,
  );
}

test(
  "real sign-in survives slow navigation; shortcuts and security boundaries work",
  { timeout: 180000 },
  async () => {
    await mkdir(output, { recursive: true });
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const email = `navigation-${randomUUID()}@example.test`;
    const password = `Nav-audit-${randomUUID()}`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Nav QA" },
    });
    assert.equal(created.error, null);
    let mode: "normal" | "slow" | "offline" | "invalid" = "normal";
    let checks = 0;
    await context.route("**/api/auth/header", async (route) => {
      checks++;
      const currentMode = mode;
      if (currentMode === "offline") {
        await route.abort();
        return;
      }
      if (currentMode === "invalid") {
        await route.fulfill({ json: { authenticated: "unknown" } });
        return;
      }
      const response = await route.fetch();
      if (currentMode === "slow") await delay(900);
      await route.fulfill({ response }).catch(() => {});
    });
    try {
      await page.goto(`${base}/login`);
      await page.getByRole("button", { name: "Decline analytics" }).click();
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await page.waitForURL(`${base}/account`);
      await labelIs(page, "Nav QA");
      console.log(
        "PASS: real local email/password login and verified account name",
      );

      // Observe the actual DOM across client navigation, including the loading window.
      await page.evaluate(() => {
        const state = window as Window & { observedAccountLabels?: string[] };
        state.observedAccountLabels = [];
        new MutationObserver(() =>
          state.observedAccountLabels?.push(
            document.querySelector(".site-auth-link")?.textContent ?? "missing",
          ),
        ).observe(document.querySelector(".site-header")!, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      });
      mode = "slow";
      for (const [name, path] of [
        ["Formats", "/formats"],
        ["Tools", "/tools"],
        ["Guides", "/guides"],
        ["Privacy", "/privacy"],
        ["Contact", "/contact"],
      ]) {
        await page
          .getByRole("navigation", { name: "Primary navigation", exact: true })
          .getByRole("link", { name, exact: true })
          .click();
        await page.waitForURL(`${base}${path}`);
        assert.equal(
          await page.locator(".site-auth-link").textContent(),
          "Nav QA",
        );
        assert.equal(
          await page.locator(".site-auth-link").getAttribute("href"),
          "/account",
        );
        assert.equal(await page.locator(".site-header").count(), 1);
      }
      await page.locator(".site-auth-link").click();
      await page.waitForURL(`${base}/account`);
      await page.getByRole("heading", { name: "Hello, Nav QA" }).waitFor();
      const observed = await page.evaluate(
        () =>
          (window as Window & { observedAccountLabels?: string[] })
            .observedAccountLabels ?? [],
      );
      assert.ok(
        observed.every((value) => value === "Nav QA"),
        JSON.stringify(observed),
      );
      assert.ok(checks >= 6);
      console.log(
        "PASS: name remains stable across top-nav routes; clicking during a slow check opens the account",
      );

      for (const failure of ["offline", "invalid"] as const) {
        mode = failure;
        await page
          .getByRole("navigation", { name: "Primary navigation", exact: true })
          .getByRole("link", { name: "Formats", exact: true })
          .click();
        await page.waitForURL(`${base}/formats`);
        await delay(250);
        assert.equal(
          await page.locator(".site-auth-link").textContent(),
          "Nav QA",
        );
        await page.locator(".site-auth-link").click();
        await page.waitForURL(`${base}/account`);
      }
      mode = "slow";
      await page.goto(`${base}/formats`, { waitUntil: "domcontentloaded" });
      assert.equal(
        await page.locator(".site-auth-link").getAttribute("href"),
        "/account",
      );
      await page.locator(".site-auth-link").click();
      await page.waitForURL(`${base}/account`);
      mode = "normal";
      await page.goto(`${base}/login`);
      await page.waitForURL(`${base}/account`);
      console.log(
        "PASS: network/contract errors preserve state; cold loading and direct login URLs verify the session",
      );

      await page.goto(`${base}/conversions`);
      await page
        .getByRole("button", { name: "Save DOCX to PDF", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Saved (1)", exact: true })
        .click();
      assert.equal(await page.locator("#conversion-results a").count(), 1);
      await page.reload();
      assert.equal(
        await page
          .getByRole("button", { name: "Unsave DOCX to PDF", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page
        .getByRole("button", { name: "Saved (1)", exact: true })
        .click();
      await noOverflow(page);
      await page.screenshot({
        path: `${output}/saved-desktop-light.png`,
        fullPage: true,
      });
      console.log(
        "PASS: saved conversions persist after reload and filter the real directory",
      );

      await page.goto(`${base}/png-to-jpg`);
      await page
        .getByRole("button", { name: "Search Convertix", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Search Convertix",
        exact: true,
      });
      await dialog.waitFor();
      await dialog
        .getByText("Recently opened in this tab", { exact: true })
        .waitFor();
      assert.equal(
        await page.evaluate(() => document.activeElement?.tagName),
        "INPUT",
      );
      for (let index = 0; index < 18; index++) {
        await page.keyboard.press("Tab");
        assert.ok(
          await page.evaluate(() =>
            Boolean(document.activeElement?.closest("dialog")),
          ),
          "focus must stay in search",
        );
      }
      await dialog.getByRole("searchbox").fill("merge pdf");
      await dialog.getByRole("searchbox").focus();
      await page.keyboard.press("ArrowDown");
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("href")),
        "/merge-pdf",
      );
      await page.keyboard.press("Enter");
      await page.waitForURL(`${base}/merge-pdf`);
      assert.equal(await dialog.count(), 0);
      await page.keyboard.press("Control+k");
      await dialog.waitFor();
      await dialog.getByRole("button", { name: "Clear recent pages" }).click();
      assert.equal(
        await dialog
          .getByText("Recently opened in this tab", { exact: true })
          .count(),
        0,
      );
      await page.keyboard.press("Escape");
      assert.equal(await dialog.count(), 0);
      console.log(
        "PASS: recent shortcuts, clear action, arrow/Enter navigation, Escape and modal focus containment",
      );

      for (const theme of ["light", "dark"] as const) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
          localStorage.setItem("convertix_theme", value);
          window.dispatchEvent(new Event("convertix-theme-change"));
        }, theme);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${base}/conversions`);
        await page
          .getByRole("button", { name: "Saved (1)", exact: true })
          .click();
        await noOverflow(page);
        await page.screenshot({
          path: `${output}/saved-mobile-${theme}.png`,
          fullPage: true,
        });
        await page.getByRole("button", { name: "Open navigation" }).click();
        await page
          .getByRole("navigation", { name: "Mobile primary navigation" })
          .getByRole("link", { name: "Nav QA", exact: true })
          .click();
        await page.waitForURL(`${base}/account`);
        await page
          .getByRole("button", { name: "Search Convertix", exact: true })
          .click();
        await dialog.waitFor();
        await noOverflow(page);
        await page.screenshot({
          path: `${output}/search-mobile-${theme}.png`,
          fullPage: true,
        });
        await page.keyboard.press("Escape");
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page
        .getByRole("button", { name: "Search Convertix", exact: true })
        .click();
      await dialog.waitFor();
      assert.equal(
        await page
          .locator(".site-search-dialog")
          .evaluate((element) => getComputedStyle(element).animationName),
        "none",
      );
      await page.keyboard.press("Escape");
      console.log(
        "PASS: mobile light/dark layouts, account routing and reduced-motion search",
      );

      for (const [data, status] of [
        [null, 400],
        [[], 400],
        [{ message: "x".repeat(40000) }, 413],
      ] as const) {
        const response = await context.request.post(`${base}/api/contact`, {
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(data),
        });
        assert.equal(response.status(), status);
      }
      assert.equal(
        (
          await context.request.post(`${base}/api/contact`, {
            headers: { Origin: "https://untrusted.example" },
            data: {},
          })
        ).status(),
        403,
      );
      const publicPage = await context.request.get(`${base}/formats`);
      assert.ok(
        publicPage
          .headers()
          ["content-security-policy"].includes("script-src-attr 'none'"),
      );
      const summary = await context.request.get(`${base}/api/auth/header`);
      assert.ok(summary.headers()["cache-control"].includes("no-store"));
      console.log(
        "PASS: contact origin/body checks and production security/cache headers",
      );

      await page.goto(`${base}/optimize-svg`);
      await page.locator('input[type="file"]').setInputFiles({
        name: "untrusted.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" onload="window.svgExecuted=true"><script>window.svgExecuted=true</script><rect width="64" height="64" style="fill:rgb(49,92,245)" onclick="alert(1)"/></svg>',
        ),
      });
      await page.getByText("The artwork matches", { exact: true }).waitFor();
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download optimized SVG", exact: true })
        .click();
      const download = await downloadEvent;
      const downloaded = await readFile((await download.path())!, "utf8");
      assert.doesNotMatch(downloaded, /<script|onload|onclick|style=/i);
      assert.ok(downloaded.includes("<svg"));
      assert.equal(
        await page.evaluate(
          () => (window as Window & { svgExecuted?: boolean }).svgExecuted,
        ),
        undefined,
      );
      await page
        .locator('input[type="file"]')
        .setInputFiles({
          name: "entity.svg",
          mimeType: "image/svg+xml",
          buffer: Buffer.from(
            '<!DOCTYPE svg [<!ENTITY x "value">]><svg xmlns="http://www.w3.org/2000/svg"/>',
          ),
        });
      await page
        .getByRole("alert")
        .filter({ hasText: "without document types or entity declarations" })
        .waitFor();
      console.log(
        "PASS: SVG download removes active markup, preserves static artwork and rejects entity declarations",
      );

      // Clear the actual local session, then let the existing header revalidate.
      await context.clearCookies();
      await page.evaluate(() =>
        window.dispatchEvent(new Event("convertix:account-updated")),
      );
      await labelIs(page, "Log in");
      await page.goto(`${base}/account`);
      await page.waitForURL(`${base}/login`);
      assert.deepEqual(errors, []);
      console.log(
        "PASS: confirmed sign-out clears the name and protected account routes redirect; no browser runtime errors",
      );
    } finally {
      await context.close();
      await browser.close();
      await admin.auth.admin.deleteUser(created.data.user!.id);
    }
  },
);
