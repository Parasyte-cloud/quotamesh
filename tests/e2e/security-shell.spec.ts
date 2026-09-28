import { expect, test } from "@playwright/test";

test("QuotaMesh shell exposes hardened headers and PWA metadata", async ({ page, request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["content-security-policy"]).not.toContain("unsafe-eval");
  expect(response.headers()["strict-transport-security"]).toContain("max-age=63072000");

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest/u);
});
