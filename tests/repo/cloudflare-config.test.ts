import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Cloudflare deployment configuration", () => {
  it("configures the web Worker for OpenNext and the API Worker for its hostname", () => {
    const web = read("apps/web/wrangler.toml");
    const api = read("apps/api/wrangler.toml");

    expect(web).toContain('name = "quotamesh"');
    expect(web).toContain('main = ".open-next/worker.js"');
    expect(api).toContain("api.quotamesh.parasyte.cloud/*");
  });

  it("uses the canonical production API origin in the web server client", () => {
    const client = read("apps/web/lib/api.ts");
    const expected =
      'process.env.QUOTAMESH_API_ORIGIN ?? "https:' +
      '//api.quotamesh.parasyte.cloud"';

    expect(client).toContain(expected);
    expect(client).not.toContain("[https:");
    expect(client).not.toContain("](https:");
  });

  it("does not commit secret values in Wrangler configuration", () => {
    for (const path of ["apps/web/wrangler.toml", "apps/api/wrangler.toml"]) {
      const contents = read(path);
      expect(contents).not.toMatch(/DATABASE_URL\s*=\s*["'][^"']+/u);
      expect(contents).not.toMatch(/SESSION_PEPPER\s*=\s*["'][^"']+/u);
      expect(contents).not.toMatch(/PRIVATE_KEY\s*=\s*["'][^"']+/u);
    }
  });

  it("documents separate least-privilege Hyperdrive identities", () => {
    const docs = read("infrastructure/cloudflare/README.md");
    expect(docs).toContain("QUOTAMESH_AUTH_HYPERDRIVE");
    expect(docs).toContain("QUOTAMESH_TENANT_HYPERDRIVE");
    expect(docs).toContain("Do not grant `BYPASSRLS`");
  });
});
