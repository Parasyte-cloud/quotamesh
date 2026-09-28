import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("security-first CI policy", () => {
  it("runs quality and secret gates in CI", () => {
    const ci = read(".github/workflows/ci.yml");
    for (const command of ["pnpm lint", "pnpm typecheck", "pnpm test", "pnpm build", "node scripts/check-secrets.mjs"]) {
      expect(ci).toContain(command);
    }
    expect(ci).toContain("dependency-review-action");
  });

  it("enables CodeQL and Dependabot", () => {
    expect(read(".github/workflows/codeql.yml")).toContain("github/codeql-action/analyze");
    const dependabot = read(".github/dependabot.yml");
    expect(dependabot).toContain('package-ecosystem: "npm"');
    expect(dependabot).toContain('package-ecosystem: "github-actions"');
  });

  it("documents private vulnerability reporting", () => {
    const security = read("SECURITY.md");
    expect(security).toMatch(/private vulnerability report|private security advisory/iu);
    expect(security).toMatch(/do not open a public issue/iu);
  });
});
