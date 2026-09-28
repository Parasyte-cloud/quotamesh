# QuotaMesh Cloudflare deployment baseline

QuotaMesh uses Cloudflare only for the public control plane. FreeRADIUS, WireGuard, controller management interfaces, and site-network management services are **not** routed through these public Workers.

## Public services

- `quotamesh.parasyte.cloud` → `quotamesh-web`
- `api.quotamesh.parasyte.cloud` → `quotamesh-api`

The web application is a Next.js 16 application adapted for Cloudflare Workers with `@opennextjs/cloudflare`. The API is a Hono Worker.

## Database isolation

The production API requires **two separate Cloudflare Hyperdrive bindings** backed by two PostgreSQL runtime identities:

- `QUOTAMESH_AUTH_HYPERDRIVE` — may execute only `resolve_auth_session(text)`.
- `QUOTAMESH_TENANT_HYPERDRIVE` — receives tenant-table privileges and remains constrained by PostgreSQL RLS.

Do not point both bindings at a database superuser or the migration owner. Separation is intentional: compromise of a tenant-data code path must not provide direct access to session hashes, and the authentication identity must not gain site-table access.

After migrations are applied by a separate migration identity, provision runtime roles with deployment-specific strong passwords and least privilege. The required privilege shape is:

```sql
CREATE ROLE quotamesh_auth LOGIN;
CREATE ROLE quotamesh_tenant LOGIN;

GRANT USAGE ON SCHEMA public TO quotamesh_auth, quotamesh_tenant;
GRANT EXECUTE ON FUNCTION resolve_auth_session(text) TO quotamesh_auth;

GRANT SELECT ON organizations, sites TO quotamesh_tenant;
GRANT INSERT, UPDATE, DELETE ON sites TO quotamesh_tenant;
```

Do not grant `BYPASSRLS`, table ownership, superuser, or direct `auth_sessions` access to either runtime role.

## Session storage

Only SHA-256 hashes of session tokens are persisted in `auth_sessions`; raw browser session tokens are not stored. Session resolution is performed through the `SECURITY DEFINER` function `resolve_auth_session(text)`, which establishes the matching organization context before reading the RLS-protected membership row. Current membership role is resolved on every request, so a role change takes effect without waiting for a session snapshot to expire.

## Runtime secrets

Configure credentials in PostgreSQL/Hyperdrive and Cloudflare bindings. Do not commit connection strings, database passwords, session tokens, private keys, or controller credentials.

The API intentionally fails closed if either required Hyperdrive binding is absent or has an empty connection string.

## Web deployment

From `apps/web` after dependencies are installed:

```bash
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

## API deployment gate

Before production API deployment, require all of the following to pass:

```bash
pnpm typecheck
pnpm test
pnpm build
node scripts/check-secrets.mjs
```

GitHub CI additionally runs PostgreSQL as a non-owner runtime role to verify RLS, persistent session resolution, and database least-privilege boundaries.
