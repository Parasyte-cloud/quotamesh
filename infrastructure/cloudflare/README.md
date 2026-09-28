# QuotaMesh Cloudflare deployment baseline

QuotaMesh uses Cloudflare only for the public control plane. FreeRADIUS, WireGuard, controller management interfaces, and site-network management services are **not** routed through these public Workers.

## Public services

- `quotamesh.parasyte.cloud` → `quotamesh-web`
- `api.quotamesh.parasyte.cloud` → `quotamesh-api`

The web application is a Next.js 16 application adapted for Cloudflare Workers with `@opennextjs/cloudflare`. The API is a Hono Worker.

## Runtime secrets

Configure values through Cloudflare secrets / environment bindings. Do not commit values.

API secret names reserved by the foundation:

- `DATABASE_URL` — control-plane PostgreSQL/Hyperdrive connection string. Prefer a Cloudflare Hyperdrive binding in production rather than exposing a database directly.
- `SESSION_PEPPER` — optional server-side session-token pepper when the persistent session store is wired.
- `AUDIT_HMAC_KEY` — future audit-event integrity key.

The foundation must not be considered ready for production API deployment until the persistent session resolver and PostgreSQL integration acceptance tests pass.

## Web deployment

From `apps/web` after dependencies are installed:

```bash
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

## API deployment

Do not deploy the authenticated API to production until `src/worker.ts` is wired to the persistent session store and tenant database. `wrangler.toml` intentionally contains no secrets.
