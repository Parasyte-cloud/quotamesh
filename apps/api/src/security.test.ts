import { describe, expect, it } from "vitest";
import { createApp } from "./app";

const emptySites = {
  async list() { return []; },
  async getById() { return null; },
  async create() { throw new Error("unused"); },
};

const silentLogger = { warn() {}, error() {} };

describe("API security middleware", () => {
  it("sets hardened security headers and a request ID on public responses", async () => {
    const app = createApp({ resolveSession: async () => null, sites: emptySites as never, logger: silentLogger });
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("content-security-policy")).not.toContain("unsafe-eval");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=63072000");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
