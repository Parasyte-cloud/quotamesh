export const ORGANIZATION_ROLES = [
  "organization_owner",
  "organization_admin",
  "network_engineer",
  "noc_operator",
  "site_manager",
  "support_operator",
  "auditor",
  "read_only",
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

const READ_PERMISSIONS = [
  "sites.read",
  "vouchers.read",
  "plans.read",
  "sessions.read",
  "networks.read",
] as const;

const ROLE_PERMISSIONS: Readonly<Record<OrganizationRole, readonly string[]>> = Object.freeze({
  organization_owner: Object.freeze([
    ...READ_PERMISSIONS,
    "sites.create",
    "sites.update",
    "sites.delete",
    "vouchers.create",
    "vouchers.revoke",
    "plans.create",
    "plans.update",
    "plans.delete",
    "sessions.disconnect",
    "networks.configure",
    "members.invite",
    "members.remove",
    "roles.manage",
    "audit.read",
    "secrets.rotate",
    "api_keys.manage",
  ]),
  organization_admin: Object.freeze([
    ...READ_PERMISSIONS,
    "sites.create",
    "sites.update",
    "vouchers.create",
    "vouchers.revoke",
    "plans.create",
    "plans.update",
    "sessions.disconnect",
    "networks.configure",
    "members.invite",
    "members.remove",
    "audit.read",
  ]),
  network_engineer: Object.freeze([
    "sites.read",
    "sites.create",
    "sites.update",
    "sessions.read",
    "sessions.disconnect",
    "networks.read",
    "networks.configure",
  ]),
  noc_operator: Object.freeze([
    "sites.read",
    "sessions.read",
    "sessions.disconnect",
    "networks.read",
  ]),
  site_manager: Object.freeze([
    "sites.read",
    "vouchers.read",
    "vouchers.create",
    "vouchers.revoke",
    "plans.read",
    "sessions.read",
    "sessions.disconnect",
  ]),
  support_operator: Object.freeze([
    "sites.read",
    "vouchers.read",
    "sessions.read",
  ]),
  auditor: Object.freeze([
    ...READ_PERMISSIONS,
    "audit.read",
  ]),
  read_only: Object.freeze([...READ_PERMISSIONS]),
});

export function permissionsForOrganizationRole(role: string): readonly string[] {
  if (!isOrganizationRole(role)) return [];
  return ROLE_PERMISSIONS[role];
}

export function isOrganizationRole(role: string): role is OrganizationRole {
  return (ORGANIZATION_ROLES as readonly string[]).includes(role);
}
