import { describe, expect, it } from "vitest";
import { permissionsForOrganizationRole } from "./roles";

describe("permissionsForOrganizationRole", () => {
  it("gives read-only members no write capabilities", () => {
    const permissions = permissionsForOrganizationRole("read_only");
    expect(permissions).toContain("sites.read");
    expect(permissions).not.toContain("sites.create");
    expect(permissions).not.toContain("roles.manage");
    expect(permissions).not.toContain("secrets.rotate");
  });

  it("fails closed for an unknown role", () => {
    expect(permissionsForOrganizationRole("unexpected-role")).toEqual([]);
  });

  it("allows organization owners to administer current control-plane capabilities", () => {
    const permissions = permissionsForOrganizationRole("organization_owner");
    expect(permissions).toContain("sites.read");
    expect(permissions).toContain("sites.create");
    expect(permissions).toContain("roles.manage");
    expect(permissions).toContain("secrets.rotate");
  });
});
