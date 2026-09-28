import { describe, expect, it } from "vitest";
import type { SessionRecord } from "@quotamesh/auth";
import type { OrganizationId, SiteId } from "@quotamesh/validation";
import { createApp } from "../app";
import type { Logger } from "../app-deps";
import type { SiteRepository } from "../repositories/sites";

const ORG_A = "11111111-1111-4111-8111-111111111111" as OrganizationId;
const ORG_B = "22222222-2222-4222-8222-222222222222" as OrganizationId;
const SITE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" as SiteId;
const SITE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" as SiteId;
const TOKEN = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFG";

const rows = [
  { siteId: SITE_A, organizationId: ORG_A, name: "A Site", vendor: "unifi", timezone: "Africa/Lagos", createdAt: new Date(), updatedAt: new Date() },
  { siteId: SITE_B, organizationId: ORG_B, name: "B Site", vendor: "meraki", timezone: "Africa/Lagos", createdAt: new Date(), updatedAt: new Date() },
];

function repo(): SiteRepository {
  return {
    async list(organizationId) {
      return rows.filter((row) => row.organizationId === organizationId) as never;
    },
    async getById(organizationId, siteId) {
      return (rows.find((row) => row.organizationId === organizationId && row.siteId === siteId) ?? null) as never;
    },
    async create(organizationId, input) {
      return { siteId: SITE_A, organizationId, ...input, createdAt: new Date(), updatedAt: new Date() } as never;
    },
  };
}

function logger(): Logger & { warnings: unknown[] } {
  const warnings: unknown[] = [];
  return {
    warnings,
    warn(event, data) { warnings.push({ event, data }); },
    error() {},
  };
}

function sessionRecord(organizationId = ORG_A): SessionRecord {
  return {
    sessionId: "session-a",
    userId: "user-a",
    organizationId,
    permissions: ["sites.read", "sites.create"],
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
  };
}

function authHeaders() {
  return { cookie: `qm_session=${TOKEN}`, "content-type": "application/json" };
}

describe("site routes", () => {
  it("rejects unauthenticated requests", async () => {
    const app = createApp({ resolveSession: async () => sessionRecord(), sites: repo(), logger: logger() });
    const response = await app.request("/v1/sites");
    expect(response.status).toBe(401);
  });

  it("does not expose a site from another organization even with its valid UUID", async () => {
    const app = createApp({ resolveSession: async () => sessionRecord(ORG_A), sites: repo(), logger: logger() });
    const response = await app.request(`/v1/sites/${SITE_B}`, { headers: authHeaders() });
    expect(response.status).toBe(404);
  });

  it("rejects malformed site input and rejects client-supplied organization ownership", async () => {
    const app = createApp({ resolveSession: async () => sessionRecord(), sites: repo(), logger: logger() });
    const response = await app.request("/v1/sites", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "HQ", vendor: "unifi", timezone: "Africa/Lagos", organizationId: ORG_B }),
    });
    expect(response.status).toBe(400);
  });

  it("redacts secret-like fields before rejected input reaches structured logs", async () => {
    const log = logger();
    const app = createApp({ resolveSession: async () => sessionRecord(), sites: repo(), logger: log });
    const response = await app.request("/v1/sites", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "HQ", vendor: "unifi", timezone: "Africa/Lagos", password: "do-not-log" }),
    });
    expect(response.status).toBe(400);
    expect(JSON.stringify(log.warnings)).toContain("[REDACTED]");
    expect(JSON.stringify(log.warnings)).not.toContain("do-not-log");
  });
});
