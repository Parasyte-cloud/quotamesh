import { describe, expect, it } from "vitest";
import { requireDelegablePermissions, requirePermission } from "./authorization";
import type { AuthenticatedSession } from "./session";

function session(permissions: string[]): AuthenticatedSession {
  return {
    sessionId: "s1",
    userId: "u1",
    organizationId: "550e8400-e29b-41d4-a716-446655440000" as never,
    permissions: new Set(permissions),
    expiresAt: new Date(Date.now() + 60_000),
  };
}

describe("authorization", () => {
  it("denies an absent capability", () => {
    expect(() => requirePermission(session(["sites.read"]), "sites.write")).toThrowError(/Forbidden/u);
  });

  it("prevents delegating a capability the actor does not hold", () => {
    expect(() => requireDelegablePermissions(session(["members.read"]), ["roles.manage"])).toThrowError(/Cannot delegate/u);
  });
});
