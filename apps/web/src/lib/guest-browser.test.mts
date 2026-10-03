import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright-core";

// Run against a local build with NEXT_PUBLIC_CONVERTIX_API_URL set to the
// same local origin. Conversion/storage calls are mocked; browser tools run.
const base = process.env.GUEST_TEST_SITE_URL ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Guest regression tests require a local Convertix server.");

test(
  "guests can convert repeatedly and use tools without an account",
  {
    timeout: 120000,
  },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.GUEST_TEST_BROWSER_PATH,
      args: ["--no-sandbox"],
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let authMode = "signedOut";
    let conversions = 0;
    let historyWrites = 0;
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4n8AAAAASUVORK5CYII=",
      "base64",
    );
    await context.addInitScript(() => {
      localStorage.setItem("convertix_analytics_consent", "rejected");
    });
    await context.route("**/api/auth/header", async (route) => {
      if (authMode === "offline") return route.abort();
      if (authMode === "unavailable")
        return route.fulfill({ status: 503, json: {} });
      return route.fulfill({
        json: { authenticated: false, accountLabel: "Log in" },
      });
    });
    await context.route("**/api/conversion-history", async (route) => {
      historyWrites++;
      return route.fulfill({ status: 401, json: {} });
    });
    await context.route(`${base}/uploads`, (route) =>
      route.fulfill({
        json: {
          upload_id: "test-upload",
          object_key: "uploads/test/input.jpg",
          upload_url: `${base}/test-storage`,
          content_type: "image/jpeg",
        },
      }),
    );
    await context.route(`${base}/test-storage`, (route) =>
      route.fulfill({ status: 200 }),
    );
    await context.route(`${base}/conversions`, (route) => {
      conversions++;
      return route.fulfill({
        status: 202,
        json: {
          conversion_id: `guest-${conversions}`,
          status: "queued",
          source_format: "jpg",
          target_format: "png",
        },
      });
    });
    await context.route(`${base}/conversions/guest-*`, (route) =>
      route.fulfill({
        json: {
          conversion_id: `guest-${conversions}`,
          status: "completed",
            download_url: `data:image/png;base64,${png.toString("base64")}`,
          size: png.length,
          output_key: `conversions/guest-${conversions}/output.png`,
        },
      }),
    );

    try {
      for (const mode of ["signedOut", "offline", "unavailable"]) {
        authMode = mode;
        await page.goto(base);
        await page.locator('input[type="file"]').setInputFiles({
          name: "photo.jpg",
          mimeType: "image/jpeg",
          buffer: png,
        });
        const convert = page.getByRole("button", {
          name: "Convert file",
          exact: true,
        });
        await convert.waitFor();
        assert.equal(await convert.isEnabled(), true);
        await page.locator(".target-select-button").click();
        for (const target of ["PNG", "WEBP", "PDF", "AVIF", "GIF", "HEIC"])
          await page
            .locator(".target-select-menu")
            .getByRole("button", { name: target, exact: true })
            .waitFor();
        await page
          .locator(".target-select-menu")
          .getByRole("button", { name: "PNG", exact: true })
          .click();
        await convert.click();
        const downloadEvent = page.waitForEvent("download");
        await page
          .getByRole("link", { name: "Download converted file", exact: true })
          .click();
        const download = await downloadEvent;
        assert.deepEqual(await readFile((await download.path())!), png);
        assert.equal(
          await page.getByText("Ready to convert", { exact: true }).count(),
          0,
        );
        await page
          .getByRole("button", { name: "Remove selected file", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Choose a file", exact: true })
          .waitFor();
      }
      assert.equal(conversions, 3);
      assert.equal(historyWrites, 0);

      for (const route of [
        "/compress-image",
        "/optimize-svg",
        "/compress-pdf",
        "/merge-pdf",
      ])
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(`${base}${route}`);
          assert.equal(response?.status(), 200);
          assert.equal(new URL(page.url()).pathname, route);
          assert.equal(await page.locator('input[type="file"]').count(), 1);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
        }

      await page.goto(`${base}/compress-image`);
      await page.locator('input[type="file"]').setInputFiles({
        name: "pixel.png",
        mimeType: "image/png",
        buffer: png,
      });
      await page
        .getByRole("button", { name: "Compress 1 image", exact: true })
        .click();
      await page.getByRole("link", { name: "Download", exact: true }).waitFor();
      const zipEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download all as ZIP", exact: true })
        .click();
      const zip = await zipEvent;
      assert.equal(
        (await readFile((await zip.path())!)).subarray(0, 2).toString(),
        "PK",
      );

      await page.goto(`${base}/optimize-svg`);
      await page.locator('input[type="file"]').setInputFiles({
        name: "test.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="red"/></svg>',
        ),
      });
      const svgEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download optimized SVG", exact: true })
        .click();
      assert.match(
        await readFile((await (await svgEvent).path())!, "utf8"),
        /<svg/,
      );

      await page.goto(base);
      const headline = (await page.locator("h1").textContent())!;
      assert.match(headline, /Convert files online/);
      assert.equal(await page.locator("h1 [aria-hidden]").count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
