import { describe, expect, it, vi } from "vitest";
import { createSessionResolverFromStore, type PersistedSessionStore } from "./sessions";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as never;

function store(value: Awaited<ReturnType<PersistedSessionStore["findActiveByTokenHash"]>>): PersistedSessionStore {
  return { findActiveByTokenHash: vi.fn(async () => value) };
}

describe("persistent session resolver", () => {
  it("returns null when the token is unknown", async () => {
    const resolve = createSessionResolverFromStore(store(null));
    await expect(resolve("hash")).resolves.toBeNull();
  });

  it("derives permissions from the member's current role instead of a session snapshot", async () => {
    const resolve = createSessionResolverFromStore(store({
      sessionId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      organizationId: ORG_ID,
      role: "read_only",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    }));

    const record = await resolve("hash");
    expect(record?.permissions).toContain("sites.read");
    expect(record?.permissions).not.toContain("sites.create");
  });
});
