import { describe, expect, it } from "vitest";
import { OrganizationIdSchema, SiteIdSchema, TenantContextSchema } from "./tenant";

describe("tenant identifiers", () => {
  it("accepts UUID organization and site identifiers", () => {
    const organizationId = "550e8400-e29b-41d4-a716-446655440000";
    const siteId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

    expect(OrganizationIdSchema.parse(organizationId)).toBe(organizationId);
    expect(SiteIdSchema.parse(siteId)).toBe(siteId);
    expect(TenantContextSchema.parse({ organizationId, siteId })).toEqual({ organizationId, siteId });
  });

  it("rejects malformed tenant identifiers", () => {
    expect(() => OrganizationIdSchema.parse("org-123")).toThrow();
    expect(() => SiteIdSchema.parse("site-123")).toThrow();
  });
});
