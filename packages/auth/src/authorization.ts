import type { AuthenticatedSession } from "./session";

export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requirePermission(session: AuthenticatedSession, permission: string): void {
  if (!session.permissions.has(permission)) {
    throw new AuthorizationError();
  }
}

export function requireDelegablePermissions(
  session: AuthenticatedSession,
  permissionsToAssign: readonly string[],
): void {
  for (const permission of permissionsToAssign) {
    if (!session.permissions.has(permission)) {
      throw new AuthorizationError(`Cannot delegate permission: ${permission}`);
    }
  }
}
