import { permissionsForOrganizationRole, type SessionRecord, type SessionResolver } from "@quotamesh/auth";
import type { DatabaseClient } from "@quotamesh/database";
import type { OrganizationId } from "@quotamesh/validation";

export interface PersistedSession {
  sessionId: string;
  userId: string;
  organizationId: OrganizationId;
  role: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface PersistedSessionStore {
  findActiveByTokenHash(tokenHash: string): Promise<PersistedSession | null>;
}

export function createSessionResolverFromStore(store: PersistedSessionStore): SessionResolver {
  return async (tokenHash: string): Promise<SessionRecord | null> => {
    const session = await store.findActiveByTokenHash(tokenHash);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      organizationId: session.organizationId,
      permissions: permissionsForOrganizationRole(session.role),
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };
  };
}

type ResolvedSessionRow = {
  session_id: string;
  user_id: string;
  organization_id: OrganizationId;
  role: string;
  expires_at: Date;
  revoked_at: Date | null;
};

export function createPostgresSessionStore(database: DatabaseClient): PersistedSessionStore {
  return {
    async findActiveByTokenHash(tokenHash) {
      const rows = await database.sqlClient<ResolvedSessionRow[]>`
        select session_id, user_id, organization_id, role, expires_at, revoked_at
        from resolve_auth_session(${tokenHash})
      `;
      const row = rows[0];
      if (!row) return null;

      return {
        sessionId: row.session_id,
        userId: row.user_id,
        organizationId: row.organization_id,
        role: row.role,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
      };
    },
  };
}

export function createPostgresSessionResolver(database: DatabaseClient): SessionResolver {
  return createSessionResolverFromStore(createPostgresSessionStore(database));
}
