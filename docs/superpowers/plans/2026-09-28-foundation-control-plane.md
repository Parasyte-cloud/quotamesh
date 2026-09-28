# QuotaMesh Foundation & Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-capable QuotaMesh slice: a secure monorepo, Cloudflare-ready web/API control plane, PostgreSQL multi-tenant core, authentication/authorization foundation, tenant-safe site inventory, PWA shell, and security-focused CI.

**Architecture:** Use a TypeScript monorepo for the browser/control-plane surface and PostgreSQL for durable tenant data. The public app exposes only authenticated, tenant-scoped APIs; network-control services remain out of scope for this first slice but their interfaces and identifiers are established so later RADIUS, quota-engine, and site-agent plans can integrate without changing the tenant model.

**Tech Stack:** Next.js 16+, React, TypeScript, pnpm, Turborepo, Hono, Drizzle ORM, PostgreSQL, Zod, Vitest, Playwright, Cloudflare Workers/Pages-compatible deployment, PWA manifest/service worker, GitHub Actions, CodeQL, Dependabot, secret scanning.

**Spec:** `docs/superpowers/specs/2026-09-28-quotamesh-platform-design.md`

## Global Constraints

- Product name: `QuotaMesh`.
- Repository target: `Parasyte-cloud/quotamesh`.
- Production target: `https://quotamesh.parasyte.cloud`.
- Multi-tenant isolation is mandatory; every tenant-owned row has immutable `organization_id` and every site-owned row has `site_id`.
- Client-supplied organization IDs are never accepted as authorization proof.
- Password fallback uses Argon2id; privileged roles require MFA when privileged auth is implemented.
- Authentication tokens must not be stored in `localStorage`.
- No controller credentials, RADIUS secrets, WireGuard private keys, API secrets, database passwords, or session secrets may be committed or logged.
- Public APIs are schema-validated, authenticated by default, tenant-scoped, rate-limit ready, and reject blind server-side fetching of tenant-provided URLs.
- Browser surface must support strict CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `frame-ancestors`.
- Cloudflare is the public edge; private RADIUS, WireGuard, and controller management surfaces are not exposed by this slice.
- Build with TDD and small, reviewable commits.

## Review Focus

- Cross-tenant object identifiers: a user from organization A must receive denial/not-found for organization B resources, even with a valid UUID.
- Untrusted display fields such as organization names, site names, SSIDs, and descriptions must render as text and never execute HTML/script.
- Missing, malformed, expired, or revoked sessions must fail closed on protected routes.
- Role escalation attempts must be rejected when the actor lacks the permission being assigned.
- Secret-like fields in structured logs must be redacted before serialization.

---

### Task 1: Secure Monorepo Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.env.example`
- Create: `README.md`
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`
- Create: `packages/config/package.json`
- Create: `packages/validation/package.json`
- Create: `vitest.workspace.ts`
- Test: `tests/repo/foundation.test.ts`

**Interfaces:**
- Consumes: approved platform spec.
- Produces: workspace package names `@quotamesh/web`, `@quotamesh/api`, `@quotamesh/config`, `@quotamesh/validation`; root commands `lint`, `typecheck`, `test`, `build`.

- [ ] **Step 1: Write the failing repository-structure test**

Create `tests/repo/foundation.test.ts` asserting the expected workspace files exist, package names use the `@quotamesh/*` namespace, `.env.example` contains placeholders only, and `.gitignore` excludes `.env`, `.env.*`, build output, coverage, and local secret material.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/repo/foundation.test.ts`
Expected: FAIL because the workspace files do not yet exist.

- [ ] **Step 3: Implement the minimal monorepo foundation**

Create the listed workspace/configuration files. Pin Node to `>=22`, use pnpm workspaces and Turborepo, and keep `.env.example` free of usable credentials.

- [ ] **Step 4: Run verification**

Run: `pnpm install --frozen-lockfile=false && pnpm vitest run tests/repo/foundation.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore .editorconfig .env.example README.md apps packages vitest.workspace.ts tests/repo/foundation.test.ts pnpm-lock.yaml
git commit -m "build: establish secure quotamesh monorepo"
```

### Task 2: Shared Validation and Security Primitives

**Files:**
- Create: `packages/validation/src/identifiers.ts`
- Create: `packages/validation/src/tenant.ts`
- Create: `packages/config/src/security.ts`
- Create: `packages/config/src/redaction.ts`
- Create: `packages/config/src/index.ts`
- Test: `packages/validation/src/tenant.test.ts`
- Test: `packages/config/src/redaction.test.ts`

**Interfaces:**
- Consumes: workspace foundation from Task 1.
- Produces: `OrganizationId`, `SiteId`, `TenantContextSchema`; `redactSecrets(value: unknown): unknown`; `securityHeaders` constant.

- [ ] **Step 1: Write failing tests for tenant identifiers and secret redaction**

Tests assert UUID-style organization/site identifiers are validated, malformed identifiers fail, and nested keys matching `password`, `secret`, `authorization`, `cookie`, `access_token`, `refresh_token`, `private_key`, and `radius_secret` become `[REDACTED]`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run packages/validation/src/tenant.test.ts packages/config/src/redaction.test.ts`
Expected: FAIL with missing exports/modules.

- [ ] **Step 3: Implement validation and security primitives**

Use Zod schemas and a recursive redaction helper. Define CSP/HSTS/content-type/referrer/permissions/frame-ancestor header values in `security.ts` without `unsafe-eval` or wildcard script sources.

- [ ] **Step 4: Run verification**

Run: `pnpm vitest run packages/validation/src/tenant.test.ts packages/config/src/redaction.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/validation packages/config
git commit -m "feat: add tenant validation and security primitives"
```

### Task 3: PostgreSQL Tenant Core with Drizzle and RLS Migrations

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/drizzle.config.ts`
- Create: `packages/database/src/schema/organizations.ts`
- Create: `packages/database/src/schema/memberships.ts`
- Create: `packages/database/src/schema/sites.ts`
- Create: `packages/database/src/schema/index.ts`
- Create: `packages/database/src/client.ts`
- Create: `packages/database/src/tenant-context.ts`
- Create: `packages/database/migrations/0001_tenant_core.sql`
- Create: `packages/database/src/tenant-context.test.ts`
- Create: `tests/database/rls.sql`

**Interfaces:**
- Consumes: `OrganizationId`, `SiteId` from Task 2.
- Produces: tables `organizations`, `organization_memberships`, `sites`; function `withTenant<T>(organizationId: OrganizationId, fn: (tx: TenantTransaction) => Promise<T>): Promise<T>`; RLS policy using transaction-local tenant context.

- [ ] **Step 1: Write failing schema/tenant-context tests**

Assert every tenant-owned table includes non-null `organization_id`, `sites` includes immutable `site_id`, and `withTenant` sets a transaction-scoped application tenant variable before repository access.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run packages/database/src/tenant-context.test.ts`
Expected: FAIL because database package/schema does not exist.

- [ ] **Step 3: Implement schema and migration**

Use PostgreSQL UUID primary keys, UTC timestamps, unique membership constraints, foreign keys, and RLS policies that deny rows whose `organization_id` differs from the transaction tenant setting. Do not make RLS depend on a browser-supplied header.

- [ ] **Step 4: Add cross-tenant SQL verification**

`tests/database/rls.sql` must create two organizations, set tenant context to A, prove A rows are visible, prove B rows are not visible, and prove an A-context insert cannot claim B ownership.

- [ ] **Step 5: Run verification**

Run: `pnpm vitest run packages/database/src/tenant-context.test.ts && pnpm typecheck`
Expected: PASS. If Docker/PostgreSQL is available, also run the RLS integration script against the local database and require PASS before commit.

- [ ] **Step 6: Commit**

```bash
git add packages/database tests/database
git commit -m "feat: add tenant-safe postgres core"
```

### Task 4: Authentication Session Boundary

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/src/session.ts`
- Create: `packages/auth/src/password.ts`
- Create: `packages/auth/src/authorization.ts`
- Create: `packages/auth/src/index.ts`
- Test: `packages/auth/src/session.test.ts`
- Test: `packages/auth/src/authorization.test.ts`

**Interfaces:**
- Consumes: organization membership schema from Task 3.
- Produces: `AuthenticatedSession`; `requireSession(request): Promise<AuthenticatedSession>`; `hashPassword(password): Promise<string>`; `verifyPassword(hash, password): Promise<boolean>`; `requirePermission(session, permission): void`.

- [ ] **Step 1: Write failing auth tests**

Tests assert missing/malformed/revoked/expired sessions fail closed; password hashes use Argon2id; and permission checks deny absent capabilities.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run packages/auth/src/session.test.ts packages/auth/src/authorization.test.ts`
Expected: FAIL with missing modules.

- [ ] **Step 3: Implement the session and authorization boundary**

Keep session tokens server-side/HttpOnly-cookie compatible. Do not add `localStorage` token handling. Implement permission checks as server-side functions over resolved membership capabilities.

- [ ] **Step 4: Add privilege-escalation test**

Test that an actor cannot assign or delegate a permission they do not hold.

- [ ] **Step 5: Run verification**

Run: `pnpm vitest run packages/auth && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/auth
git commit -m "feat: add secure authentication boundary"
```

### Task 5: Tenant-Scoped API Skeleton

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/middleware/session.ts`
- Create: `apps/api/src/middleware/security.ts`
- Create: `apps/api/src/middleware/request-id.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/routes/organizations.ts`
- Create: `apps/api/src/routes/sites.ts`
- Create: `apps/api/src/repositories/sites.ts`
- Test: `apps/api/src/routes/sites.test.ts`
- Test: `apps/api/src/security.test.ts`

**Interfaces:**
- Consumes: `requireSession`, `requirePermission`, `withTenant`, Zod tenant schemas, `securityHeaders`, `redactSecrets`.
- Produces: Hono app; `GET /health`; authenticated `GET /v1/sites`; authenticated `POST /v1/sites`; tenant-scoped site repository.

- [ ] **Step 1: Write failing API tests**

Assert protected routes reject unauthenticated requests, organization A cannot fetch organization B's site by identifier, malformed site input receives 400, and responses include required security headers and a request ID.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run apps/api/src/routes/sites.test.ts apps/api/src/security.test.ts`
Expected: FAIL with missing app/routes.

- [ ] **Step 3: Implement API middleware and site routes**

Resolve tenant context exclusively from the authenticated session/membership. Ignore or reject any client-provided organization ID used as an authorization claim. Validate request bodies with Zod.

- [ ] **Step 4: Add log-redaction assertion**

Trigger a rejected request containing secret-like keys and assert structured logs contain `[REDACTED]` rather than raw values.

- [ ] **Step 5: Run verification**

Run: `pnpm vitest run apps/api && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat: add tenant-scoped control plane api"
```

### Task 6: Secure Web/PWA Shell

**Files:**
- Create: `apps/web/next.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/(app)/layout.tsx`
- Create: `apps/web/app/(app)/sites/page.tsx`
- Create: `apps/web/app/manifest.ts`
- Create: `apps/web/public/icons/icon-192.png`
- Create: `apps/web/public/icons/icon-512.png`
- Create: `apps/web/public/icons/icon-maskable-512.png`
- Create: `apps/web/components/app-shell.tsx`
- Create: `apps/web/components/site-list.tsx`
- Create: `apps/web/lib/api.ts`
- Test: `apps/web/components/site-list.test.tsx`
- Test: `tests/e2e/security-shell.spec.ts`

**Interfaces:**
- Consumes: authenticated `/v1/sites` API from Task 5; `securityHeaders` from Task 2.
- Produces: responsive QuotaMesh application shell, PWA manifest, authenticated Sites view, no browser-side long-lived auth storage.

- [ ] **Step 1: Write failing UI tests**

Assert tenant-provided site names render as text (for example `<img src=x onerror=...>` is displayed, not interpreted), loading/error states are accessible, and no auth token is written to `localStorage`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run apps/web/components/site-list.test.tsx`
Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement application shell and Sites view**

Create the navigation defined in the spec, with Overview and Sites active in this slice and remaining entries visibly present but not falsely functional. Fetch through the server/session boundary rather than exposing durable credentials to client JavaScript.

- [ ] **Step 4: Implement PWA metadata and security headers**

Add manifest, icons, theme metadata, and Next.js header configuration matching the strict security constants. Do not add permissive CSP directives to make development easier in production configuration.

- [ ] **Step 5: Add Playwright shell/security test**

Assert the app returns security headers, installs valid manifest metadata, and renders hostile tenant strings inertly.

- [ ] **Step 6: Run verification**

Run: `pnpm test && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web tests/e2e
git commit -m "feat: add secure quotamesh pwa shell"
```

### Task 7: Cloudflare Deployment Configuration

**Files:**
- Create: `apps/api/wrangler.toml`
- Create: `apps/web/wrangler.toml`
- Create: `infrastructure/cloudflare/README.md`
- Create: `infrastructure/cloudflare/headers.md`
- Test: `tests/repo/cloudflare-config.test.ts`

**Interfaces:**
- Consumes: build outputs from Tasks 5-6.
- Produces: non-secret Cloudflare deployment configuration and documented environment bindings for `quotamesh.parasyte.cloud`.

- [ ] **Step 1: Write failing deployment-config tests**

Assert no secret values appear in committed Wrangler config, production route names reference `quotamesh.parasyte.cloud`, and sensitive values are documented as runtime secrets rather than plaintext variables.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm vitest run tests/repo/cloudflare-config.test.ts`
Expected: FAIL because deployment configuration does not exist.

- [ ] **Step 3: Implement Cloudflare configuration and operator notes**

Document the exact secret/binding names required without values. Keep private-network services out of Cloudflare public routing.

- [ ] **Step 4: Run verification**

Run: `pnpm vitest run tests/repo/cloudflare-config.test.ts && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/wrangler.toml apps/web/wrangler.toml infrastructure/cloudflare tests/repo/cloudflare-config.test.ts
git commit -m "ops: add cloudflare deployment baseline"
```

### Task 8: Security-First CI and Dependency Governance

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/codeql.yml`
- Create: `.github/dependabot.yml`
- Create: `.github/CODEOWNERS`
- Create: `SECURITY.md`
- Create: `scripts/check-secrets.mjs`
- Test: `tests/repo/security-ci.test.ts`

**Interfaces:**
- Consumes: root `lint`, `typecheck`, `test`, `build` commands.
- Produces: required CI jobs for lint, typecheck, unit/integration tests, production build, secret-pattern scan, dependency review, and CodeQL.

- [ ] **Step 1: Write failing CI-policy test**

Assert CI invokes lint/typecheck/test/build, runs the repository secret check, CodeQL exists, Dependabot is configured for npm/pnpm and GitHub Actions, and `SECURITY.md` defines private vulnerability reporting expectations.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm vitest run tests/repo/security-ci.test.ts`
Expected: FAIL because CI/security files do not exist.

- [ ] **Step 3: Implement workflows and secret scanner**

The secret scanner must reject obvious private-key blocks, real-looking API secrets, and committed `.env` files while allowing documented placeholders in `.env.example`.

- [ ] **Step 4: Run full local verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && node scripts/check-secrets.mjs`
Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add .github SECURITY.md scripts/check-secrets.mjs tests/repo/security-ci.test.ts
git commit -m "ci: enforce security and quality gates"
```

### Task 9: Foundation Acceptance Gate

**Files:**
- Modify only if verification exposes defects in files owned by Tasks 1-8.
- Create: `docs/architecture/foundation-acceptance.md`

**Interfaces:**
- Consumes: completed Tasks 1-8.
- Produces: verified foundation ready for the next subsystem plan: site enrollment/device identity and network data plane.

- [ ] **Step 1: Run complete quality gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && node scripts/check-secrets.mjs`
Expected: PASS with no warnings treated as security failures.

- [ ] **Step 2: Run cross-tenant and hostile-input acceptance checks**

Verify the cross-tenant API negative tests, RLS integration test when PostgreSQL is available, hostile display-string XSS test, invalid-session fail-closed test, privilege-escalation test, and secret-redaction test all pass.

- [ ] **Step 3: Write acceptance record**

Document tool versions, commands run, pass/fail results, any intentionally deferred controls, and the exact next subsystem boundary. Do not claim production readiness for RADIUS/WireGuard/site-agent functionality that this plan does not implement.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture/foundation-acceptance.md
git commit -m "docs: record foundation acceptance gate"
```

## Deferred to Follow-on Plans

This plan intentionally does not implement the entire platform in one branch. The approved spec spans independent security-sensitive subsystems, so they should be implemented as separate plans after this foundation passes:

1. Site enrollment, mTLS device identity, signed command protocol, and replay protection.
2. FreeRADIUS, accounting ingestion, RADIUS secrets/NAS lifecycle, and WireGuard segmentation.
3. Quota engine, disconnect job state machine, idempotency, retry/dead-letter handling, and health telemetry.
4. UniFi, Meraki, and MikroTik vendor adapters plus commissioning diagnostics.
5. Voucher/plan operations, batch generation/export, analytics, alerts, immutable audit log, passkeys/MFA completion, and production HA/backup/restore testing.
