import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Cloudflare deployment configuration", () => {
  it("routes web and API services to the intended parasyte.cloud hostnames", () => {
    expect(read("apps/web/wrangler.toml")).toContain("quotamesh.parasyte.cloud/*");
    expect(read("apps/api/wrangler.toml")).toContain("api.quotamesh.parasyte.cloud/*");
  });

  it("does not commit secret values in Wrangler configuration", () => {
    for (const path of ["apps/web/wrangler.toml", "apps/api/wrangler.toml"]) {
      const contents = read(path);
      expect(contents).not.toMatch(/DATABASE_URL\s*=\s*["'][^"']+/u);
      expect(contents).not.toMatch(/SESSION_PEPPER\s*=\s*["'][^"']+/u);
      expect(contents).not.toMatch(/PRIVATE_KEY\s*=\s*["'][^"']+/u);
    }
  });

  it("documents runtime secret names without secret values", () => {
    const docs = read("infrastructure/cloudflare/README.md");
    expect(docs).toContain("DATABASE_URL");
    expect(docs).toContain("SESSION_PEPPER");
    expect(docs).toContain("Do not commit values");
  });
});
