# QuotaMesh Platform Design

Date: 2026-09-28
Status: Design approved in conversation; pending written-spec review
Repository target: `Parasyte-cloud/quotamesh`
Production target: `https://quotamesh.parasyte.cloud`

## 1. Purpose

QuotaMesh is a security-first, multi-tenant guest Wi-Fi quota enforcement and network access management platform. It centralizes tenant onboarding, site onboarding, RADIUS authentication and accounting, vouchers, quota plans, usage tracking, disconnect enforcement, monitoring, diagnostics, and auditability across UniFi, Meraki, and MikroTik environments.

The platform is designed for seamless customer onboarding while preserving hard isolation between organizations, sites, agents, network credentials, and infrastructure.

## 2. Source Architecture Decision

The source design establishes Design A — existing portal plus shared RADIUS plus quota watcher — as the standard for guest networks on UniFi and Meraki where small quota overshoot is acceptable. Design B — MikroTik hotspot plus shared RADIUS — remains an optional exact-cap mode for sites that later require billing-grade byte enforcement.

QuotaMesh preserves that decision while replacing ad-hoc scripts and manual administration with a structured SaaS control plane, a hardened quota engine, and per-site secure agents.

## 3. Goals

- Multi-tenant SaaS with strong organization and site isolation.
- Seamless onboarding for organizations, users, and network sites.
- Centralized voucher and quota-plan management.
- Shared RADIUS authentication and accounting backend.
- UniFi and Meraki support through standard enforcement mode.
- MikroTik support for exact byte-limit enforcement.
- Security-first site connectivity with no public controller exposure.
- Resilient quota enforcement with retries, health monitoring, and alerts.
- Complete auditability for privileged and network-affecting operations.
- PWA-ready operations interface for desktop and mobile NOC workflows.
- Cloudflare-hosted public control plane with private Linux network services.

## 4. Non-Goals for Initial Release

- Consumer billing or hotspot resale.
- Generic remote shell access to customer sites.
- Arbitrary customer-defined agent commands.
- Deep configuration management for all router features.
- Full replacement of vendor network controllers.
- Cross-tenant data sharing.

The data model should remain future-compatible with paid Wi-Fi and self-service top-ups, but these are not part of the first production release.

## 5. System Architecture

QuotaMesh has two major planes.

### 5.1 Public Control Plane

Hosted behind Cloudflare:

- Web application
- Authentication and authorization
- Organizations and memberships
- Site inventory and onboarding
- Voucher and quota-plan management
- Usage dashboards
- Alerts and audit logs
- Public API
- Agent enrollment service
- Signed command dispatch
- Notification orchestration

The control plane must not directly expose or blindly connect to tenant network controllers.

### 5.2 Private Network Data Plane

Runs on hardened Linux infrastructure:

- FreeRADIUS
- PostgreSQL-compatible operational database or isolated RADIUS database
- Quota engine
- Accounting ingestion and aggregation
- Disconnect job workers
- WireGuard hub
- Vendor integration services where required
- Metrics and health exporters

The data plane communicates with sites through private WireGuard tunnels and authenticated site-agent channels.

### 5.3 Site Agent

Each managed site runs a QuotaMesh Site Agent or uses an approved gateway integration. The agent:

- establishes outbound authenticated connectivity to QuotaMesh;
- owns its own device identity;
- exposes no generic remote shell;
- executes only schema-validated commands;
- talks locally to UniFi, Meraki, or MikroTik control surfaces as permitted;
- reports heartbeat and health;
- performs controller tests and client disconnect operations;
- keeps tenant controller credentials local or encrypted under site-scoped keys wherever practical.

## 6. Multi-Tenant Model

Top-level entities:

- Platform
- Organization / tenant
- Organization member
- Role
- Permission
- Site
- Network
- NAS device
- Site agent
- Controller integration
- Quota plan
- Voucher batch
- Voucher
- Session
- Accounting record
- Usage rollup
- Disconnect job
- Alert
- Audit event
- API key
- Webhook

Every tenant-owned row contains an immutable organization identifier. Site-scoped rows also contain a site identifier.

Tenant isolation is enforced at multiple layers:

1. authenticated session or API identity;
2. organization membership validation;
3. server-side permission checks;
4. tenant-scoped repository/service access;
5. PostgreSQL Row-Level Security where supported;
6. cross-tenant negative tests in CI.

Client-supplied organization IDs are never accepted as authorization proof.

## 7. Roles and Permissions

Initial roles:

- Platform Owner
- Platform Admin
- Organization Owner
- Organization Admin
- Network Engineer
- NOC Operator
- Site Manager
- Support Operator
- Auditor
- Read Only

Permissions are explicit capabilities, including:

- sites.read/create/update/delete
- vouchers.read/create/revoke
- plans.read/create/update/delete
- sessions.read/disconnect
- networks.read/configure
- members.invite/remove
- roles.manage
- audit.read
- secrets.rotate
- api_keys.manage

Users cannot grant permissions they do not themselves possess.

## 8. Authentication and Session Security

- Passkeys/WebAuthn supported.
- MFA required for privileged roles.
- Password fallback uses Argon2id.
- Breached-password checks and rate limiting.
- Secure, HttpOnly, SameSite cookies.
- No auth tokens in localStorage.
- Session revocation and active-session management.
- Re-authentication for privileged operations.
- Login, MFA, recovery, and authorization events included in the audit trail.

## 9. Site Enrollment and Device Identity

Site enrollment uses a short-lived, single-use enrollment token.

Flow:

1. Admin creates a site.
2. QuotaMesh issues a short-lived enrollment token.
3. Installer/agent exchanges the token once.
4. Agent generates or receives its long-lived device identity.
5. Enrollment token is invalidated.
6. Agent establishes mTLS-authenticated outbound communication.
7. WireGuard peer is provisioned with site-specific routes.
8. Commissioning tests run before activation.

Each site receives unique credentials and keys. No global tenant-shared RADIUS secret or agent key is permitted.

## 10. WireGuard and Network Segmentation

- One WireGuard peer per site.
- Narrow AllowedIPs; avoid broad site-to-site access.
- Site A cannot communicate with Site B through QuotaMesh.
- RADIUS UDP 1812/1813 and CoA/Disconnect UDP 3799 are reachable only over approved private paths.
- Controller management interfaces remain private.
- Management, application, RADIUS, database, VPN, and observability zones are logically separated.

## 11. RADIUS Architecture

FreeRADIUS provides:

- authentication;
- accounting;
- quota-profile checks;
- simultaneous-use enforcement;
- CoA/Disconnect support where applicable.

Voucher credentials map to quota plans such as data allowance, validity period, rate limit, and device concurrency.

Usage is derived from accounting totals for input plus output octets and aggregated by voucher identity, not by MAC address.

RADIUS clients use unique long random secrets and known NAS identities. Authentication failure telemetry and abuse detection are mandatory.

## 12. Quota Plans and Vouchers

Quota plan fields include:

- name
- data allowance
- validity period
- activation rule
- upload rate
- download rate
- simultaneous-device limit
- optional session timeout
- enforcement mode

Voucher lifecycle:

- DRAFT
- ISSUED
- ACTIVE
- EXHAUSTED
- EXPIRED
- SUSPENDED
- REVOKED

Voucher creation supports batches and later export to PDF, CSV, QR card, printable sheet, and API response.

## 13. Session and Enforcement State

Session lifecycle:

- AUTHENTICATING
- AUTHORIZED
- ONLINE
- LIMIT_APPROACHING
- QUOTA_EXCEEDED
- DISCONNECT_PENDING
- DISCONNECT_RETRYING
- DISCONNECTED
- DISCONNECT_FAILED

Every enforcement attempt records:

- organization
- site
- session
- device
- vendor
- quota at decision time
- request timestamp
- attempt count
- provider response
- completion timestamp
- latency
- final result

## 14. Vendor Drivers

Vendor-specific behavior is isolated behind a stable interface.

Required capabilities:

- test connection
- resolve active client/session
- disconnect guest
- retrieve health metadata

Initial drivers:

- UniFiDriver
- MerakiDriver
- MikroTikDriver

UniFi standard mode uses RADIUS for login/accounting and a controlled disconnect path for quota enforcement.

Meraki standard mode uses RADIUS plus CoA where supported, with a vendor API fallback only where necessary and explicitly configured.

MikroTik exact mode receives local byte-limit attributes and enforces them directly at the hotspot gateway.

## 15. Quota Engine

The quota engine is a long-running service, preferably Go, designed for concurrency and operational reliability.

Responsibilities:

- consume accounting updates;
- aggregate usage;
- compare usage against plan limits;
- generate enforcement decisions;
- enqueue disconnect jobs;
- retry failed disconnects;
- maintain idempotency;
- emit structured metrics and logs;
- publish health heartbeats;
- raise alerts on enforcement degradation.

The engine must not be implemented as a generic cron script in production.

## 16. Signed Agent Commands

Agent commands are allowlisted operations rather than arbitrary commands.

Examples:

- DISCONNECT_GUEST
- CHECK_RADIUS
- FETCH_CLIENT
- TEST_CONTROLLER
- ROTATE_SITE_SECRET
- REPORT_HEALTH

Each command contains:

- command ID
- organization ID
- site ID
- action
- payload
- issued-at timestamp
- expiry
- nonce
- signature

The agent validates signature, scope, expiration, and replay status before execution.

## 17. Secret Management

Secrets must never be committed to Git, returned to browsers unnecessarily, or logged.

Sensitive material includes:

- controller credentials
- RADIUS secrets
- API keys
- WireGuard private keys
- mTLS private keys
- database credentials
- session secrets

Use envelope encryption or managed KMS-style key management. Prefer tenant/site-scoped data encryption keys. API secrets are displayed once and stored only as hashes where verification rather than recovery is required.

Logs automatically redact fields such as password, secret, authorization, cookie, access token, refresh token, private key, and RADIUS secret.

## 18. Public API Security

- Explicit versioning.
- Authentication required by default.
- Tenant-scoped authorization on every route.
- Zod or equivalent schema validation.
- Rate limits by endpoint, identity, tenant, and source as appropriate.
- Idempotency keys for sensitive create/mutation flows.
- CSRF protection for cookie-authenticated mutations.
- No blind server-side fetching of tenant-provided URLs.
- SSRF protections for all network-address inputs.

## 19. Browser Security

- Strict Content Security Policy.
- HSTS.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Frame protections using CSP frame-ancestors.
- No unsafe dynamic HTML rendering from untrusted tenant data.
- Output encoding and sanitization for organization names, SSIDs, site names, voucher descriptions, and imported metadata.

## 20. Cloudflare Edge Security

Use Cloudflare for:

- TLS termination
- DDoS mitigation
- WAF
- rate limiting
- bot controls where available
- Turnstile for abuse-sensitive public forms
- DNSSEC
- optional Cloudflare Access for privileged internal/admin surfaces

The Cloudflare application does not replace private network segmentation or service-level authentication.

## 21. Data Storage

Control-plane database: PostgreSQL.

Suggested application data access: Drizzle ORM with parameterized queries.

Logical database identities should be separated by responsibility, for example:

- application API
- RADIUS/accounting
- workers
- migrations

Backups are encrypted, off-host, retention-controlled, and periodically restore-tested.

## 22. Observability

Health signals include:

- RADIUS authentication test
- accounting freshness
- WireGuard handshake age
- site-agent heartbeat
- controller connectivity
- quota-engine heartbeat
- disconnect success rate
- disconnect latency
- queue depth
- database capacity
- backup success

Critical failures must produce prominent alerts, especially any condition where guests may remain online beyond quota.

## 23. Audit Trail

Security-sensitive operations produce immutable audit events containing:

- actor
- organization
- site
- action
- resource
- timestamp
- source metadata
- request ID
- result
- redacted before/after state where relevant

Examples include login failures, MFA changes, role changes, site-agent revocation, RADIUS secret rotation, controller credential changes, voucher revocation, client disconnects, and API-key lifecycle events.

## 24. PWA and User Experience

The control plane is responsive and PWA-ready.

Primary navigation:

- Overview
- Organizations
- Sites
- Guests
- Vouchers
- Plans
- Sessions
- Analytics
- Alerts
- Audit Logs
- Settings

Site onboarding wizard:

1. General
2. Vendor
3. Connectivity
4. RADIUS
5. Guest Network
6. Quota Policy
7. Test
8. Activate

Commissioning results must show concrete pass/fail state for WireGuard, RADIUS authentication, accounting, NAS registration, controller API, quota engine, disconnect, and rate limiting.

## 25. Proposed Repository Structure

```text
quotamesh/
├── apps/
│   ├── web/
│   ├── api/
│   └── docs/
├── services/
│   ├── radius/
│   ├── quota-engine/
│   ├── accounting/
│   └── site-agent/
├── packages/
│   ├── database/
│   ├── auth/
│   ├── ui/
│   ├── validation/
│   ├── network-core/
│   ├── radius-core/
│   ├── observability/
│   └── config/
├── integrations/
│   ├── unifi/
│   ├── meraki/
│   └── mikrotik/
├── infrastructure/
│   ├── cloudflare/
│   ├── radius/
│   ├── wireguard/
│   ├── docker/
│   └── terraform/
├── docs/
│   └── superpowers/
│       └── specs/
├── migrations/
├── scripts/
├── tests/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

## 26. Technology Baseline

- Next.js 16+
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible component architecture
- Hono for Cloudflare Worker APIs
- PostgreSQL
- Drizzle ORM
- Zod
- Go for long-running quota and site-agent services
- FreeRADIUS
- WireGuard
- Cloudflare Workers / Pages / R2 / Queues where appropriate
- OpenTelemetry
- Prometheus/Grafana-compatible metrics
- Sentry or equivalent error reporting
- GitHub Actions
- Docker for local and service environments

## 27. CI/CD Security Gates

Every pull request must run, as applicable:

- formatting/lint
- typecheck
- unit tests
- integration tests
- tenant-isolation tests
- authorization tests
- security regression tests
- secret scanning
- dependency review
- SAST / CodeQL
- container scanning
- production build

Critical security findings block merge.

The main branch is protected; production deployment occurs only from reviewed, passing code.

## 28. Test Strategy

### Application

- auth and session tests
- permission matrix tests
- tenant boundary tests
- IDOR regression tests
- CSRF tests
- XSS tests
- SQL injection tests
- SSRF tests
- rate-limit tests
- secret-redaction tests

### Networking

- RADIUS authentication
- RADIUS rejection for exhausted voucher
- accounting start/interim/stop
- simultaneous-use enforcement
- MAC-randomization does not reset voucher quota
- speed-limit validation
- UniFi disconnect test
- Meraki CoA/fallback test
- MikroTik exact-limit test
- WireGuard segmentation
- site-agent command signature and replay protection

### Resilience

- RADIUS node unavailable
- database unavailable
- site agent unavailable
- controller unavailable
- stale WireGuard handshake
- quota-engine failure
- queue retry/dead-letter behavior
- backup restore verification

## 29. Initial Delivery Sequence

1. Repository and monorepo foundation.
2. Security baseline and CI gates.
3. Authentication and multi-tenant organization model.
4. RBAC and database RLS.
5. Site model and onboarding wizard shell.
6. Site-agent enrollment and device identity.
7. RADIUS infrastructure and accounting schema.
8. Voucher and quota-plan management.
9. Quota engine and enforcement jobs.
10. UniFi driver.
11. Meraki driver.
12. MikroTik exact-mode driver.
13. Monitoring, diagnostics, and alerting.
14. Production hardening, HA, backups, and operational runbooks.

## 30. Security Invariant

A compromise of one browser, one user, one site, one tenant, one controller integration, or one site agent must not provide a path to compromise another tenant or the QuotaMesh platform.

This invariant is treated as an architectural acceptance criterion, not an aspirational statement.
