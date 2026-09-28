import { describe, expect, it } from "vitest";
import { requireSession, type SessionRecord, type SessionResolver } from "./session";

const TOKEN = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFG";
const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as never;

function requestWithToken(token = TOKEN): Request {
  return new Request("https://quotamesh.parasyte.cloud/v1/sites", {
    headers: { cookie: `qm_session=${token}` },
  });
}

function validRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: ORG_ID,
    permissions: ["sites.read"],
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

function resolver(record: SessionRecord | null): SessionResolver {
  return async () => record;
}

describe("requireSession", () => {
  it("fails closed when the session cookie is missing", async () => {
    await expect(requireSession(new Request("https://quotamesh.parasyte.cloud"), resolver(validRecord()))).rejects.toMatchObject({ status: 401 });
  });

  it("fails closed for malformed session tokens", async () => {
    await expect(requireSession(requestWithToken("short"), resolver(validRecord()))).rejects.toMatchObject({ status: 401 });
  });

  it("fails closed for revoked sessions", async () => {
    await expect(requireSession(requestWithToken(), resolver(validRecord({ revokedAt: new Date() })))).rejects.toMatchObject({ status: 401 });
  });

  it("fails closed for expired sessions", async () => {
    await expect(requireSession(requestWithToken(), resolver(validRecord({ expiresAt: new Date(Date.now() - 1) })))).rejects.toMatchObject({ status: 401 });
  });

  it("returns tenant context only for a valid active session", async () => {
    const session = await requireSession(requestWithToken(), resolver(validRecord()));
    expect(session.organizationId).toBe(ORG_ID);
    expect(session.permissions.has("sites.read")).toBe(true);
  });
});
