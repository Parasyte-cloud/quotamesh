import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SKIP_DIRECTORIES = new Set([".git", ".next", ".turbo", ".superpowers", "coverage", "dist", "node_modules"]);
const TEXT_EXTENSIONS = new Set(["", ".cjs", ".css", ".html", ".js", ".json", ".jsonc", ".jsx", ".md", ".mjs", ".sql", ".toml", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const ALLOWED_ENV_FILES = new Set([".env.example"]);

const SECRET_PATTERNS = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u },
  { name: "GitHub personal access token", pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/u },
  { name: "Stripe live secret", pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/u },
  { name: "Cloudflare API token assignment", pattern: /(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*=\s*["']?[A-Za-z0-9_-]{30,}/u },
];

const findings = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const absolute = resolve(directory, entry.name);
    const path = relative(ROOT, absolute).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    if (!entry.isFile()) continue;

    if ((entry.name === ".env" || entry.name.startsWith(".env.")) && !ALLOWED_ENV_FILES.has(entry.name)) {
      findings.push(`${path}: committed environment file is forbidden`);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
    const info = await stat(absolute);
    if (info.size > 1_000_000) continue;

    const content = await readFile(absolute, "utf8");
    for (const candidate of SECRET_PATTERNS) {
      if (candidate.pattern.test(content)) findings.push(`${path}: possible ${candidate.name}`);
    }
  }
}

await walk(ROOT);

if (findings.length > 0) {
  console.error("QuotaMesh secret scan failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log("QuotaMesh secret scan passed: no forbidden secret patterns found.");
}
