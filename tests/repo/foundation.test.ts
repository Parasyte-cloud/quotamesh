import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

describe("QuotaMesh repository foundation", () => {
  test("creates the expected workspace files", () => {
    const expected = [
      "package.json",
      "pnpm-workspace.yaml",
      "turbo.json",
      "tsconfig.base.json",
      ".gitignore",
      ".editorconfig",
      ".env.example",
      "README.md",
      "apps/web/package.json",
      "apps/api/package.json",
      "packages/config/package.json",
      "packages/validation/package.json",
      "vitest.config.ts"
    ];
    for (const file of expected) expect(existsSync(resolve(root, file)), file).toBe(true);
  });

  test("uses the quotamesh package namespace", () => {
    expect(readJson("apps/web/package.json").name).toBe("@quotamesh/web");
    expect(readJson("apps/api/package.json").name).toBe("@quotamesh/api");
    expect(readJson("packages/config/package.json").name).toBe("@quotamesh/config");
    expect(readJson("packages/validation/package.json").name).toBe("@quotamesh/validation");
  });

  test("keeps local secrets out of source control", () => {
    const gitignore = readFileSync(resolve(root, ".gitignore"), "utf8");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain("*.key");
    expect(gitignore).toContain("secrets/");

    const example = readFileSync(resolve(root, ".env.example"), "utf8");
    expect(example).toContain("QUOTAMESH_AUTH_DATABASE_URL=");
    expect(example).toContain("QUOTAMESH_TENANT_DATABASE_URL=");
    expect(example).toContain("<local-password>");
    expect(example).not.toMatch(/sk_live_|ghp_|AKIA[0-9A-Z]{16}/);
  });
});
