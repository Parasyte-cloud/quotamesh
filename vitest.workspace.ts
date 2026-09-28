import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "tests/**/*.test.ts",
  "apps/**/*.test.ts",
  "packages/**/*.test.ts"
]);
