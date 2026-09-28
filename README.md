# QuotaMesh

Security-first, multi-tenant guest Wi-Fi quota enforcement and network access platform for UniFi, Meraki, and MikroTik environments.

## Targets

- Production: `https://quotamesh.parasyte.cloud`
- Repository: `Parasyte-cloud/quotamesh`
- Public control plane: Cloudflare
- Private network plane: FreeRADIUS, WireGuard, quota engine, site agents

## Development

Requires Node.js 22+ and pnpm.

```bash
corepack enable
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

Never commit real `.env` files, private keys, controller credentials, RADIUS secrets, database passwords, or session secrets.
