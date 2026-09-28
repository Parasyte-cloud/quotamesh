import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("production API gate", () => {
  it("has a concrete Cloudflare worker entrypoint", () => {
    expect(existsSync(resolve(root, "apps/api/src/worker.ts"))).toBe(true);
  });

  it("documents separate auth and tenant Hyperdrive bindings", () => {
    const wrangler = readFileSync(resolve(root, "apps/api/wrangler.toml"), "utf8");
    expect(wrangler).toContain("QUOTAMESH_AUTH_HYPERDRIVE");
    expect(wrangler).toContain("QUOTAMESH_TENANT_HYPERDRIVE");
  });
});
