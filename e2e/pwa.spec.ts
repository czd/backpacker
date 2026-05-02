import { expect, test } from "@playwright/test";

// PWA-layer e2e tests — run at the mobile viewport configured in
// playwright.config.ts. These verify the artifacts that make the app
// installable on iOS and Android home screens (AGENTS.md §6.6, §13 M0 DoD).

test.describe("PWA manifest", () => {
  test("manifest.webmanifest is served and contains the required fields", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);

    const manifest = await res.json();

    expect(manifest.name).toBe("Backpacker");
    expect(manifest.short_name).toBe("Backpacker");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();

    // Three icons required: 192, 512, and a 512 maskable.
    expect(Array.isArray(manifest.icons)).toBe(true);
    const icons = manifest.icons as Array<{
      sizes: string;
      purpose?: string;
      src: string;
    }>;

    expect(icons.find((i) => i.sizes === "192x192")).toBeTruthy();
    expect(icons.find((i) => i.sizes === "512x512" && i.purpose === "any"))
      .toBeTruthy();
    expect(
      icons.find((i) => i.sizes === "512x512" && i.purpose === "maskable"),
    ).toBeTruthy();
  });
});

test.describe("PWA icons", () => {
  const iconPaths = [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
  ];

  for (const path of iconPaths) {
    test(`${path} is served as image/png`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      const contentType = res.headers()["content-type"] ?? "";
      expect(contentType).toContain("image/png");
    });
  }
});

test.describe("PWA meta on the splash route", () => {
  test("renders manifest link, theme-color (light + dark), apple-touch-icon", async ({
    page,
  }) => {
    await page.goto("/");

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");

    // Both color-scheme variants present per AGENTS.md theme-color contract.
    const lightThemeColor = page.locator(
      'meta[name="theme-color"][media="(prefers-color-scheme: light)"]',
    );
    const darkThemeColor = page.locator(
      'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
    );
    await expect(lightThemeColor).toHaveAttribute("content", "#f6f1e6");
    await expect(darkThemeColor).toHaveAttribute("content", "#2a2520");

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon.first()).toHaveAttribute(
      "href",
      /\/icons\/apple-touch-icon\.png/,
    );
  });
});
