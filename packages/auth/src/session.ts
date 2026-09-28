import type { OrganizationId } from "@quotamesh/validation";

const SESSION_COOKIE = "qm_session";
const MIN_TOKEN_LENGTH = 32;

export interface SessionRecord {
  sessionId: string;
  userId: string;
  organizationId: OrganizationId;
  permissions: readonly string[];
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  organizationId: OrganizationId;
  permissions: ReadonlySet<string>;
  expiresAt: Date;
}

export type SessionResolver = (tokenHash: string) => Promise<SessionRecord | null>;

export async function requireSession(
  request: Request,
  resolveSession: SessionResolver,
): Promise<AuthenticatedSession> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token || token.length < MIN_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new SessionAuthenticationError("Invalid session");
  }

  const tokenHash = await sha256Base64Url(token);
  const record = await resolveSession(tokenHash);
  const now = Date.now();

  if (!record || record.revokedAt !== null || record.expiresAt.getTime() <= now) {
    throw new SessionAuthenticationError("Invalid session");
  }

  return Object.freeze({
    sessionId: record.sessionId,
    userId: record.userId,
    organizationId: record.organizationId,
    permissions: new Set(record.permissions),
    expiresAt: new Date(record.expiresAt),
  });
}

export function createSessionBoundary(resolveSession: SessionResolver) {
  return (request: Request): Promise<AuthenticatedSession> => requireSession(request, resolveSession);
}

export class SessionAuthenticationError extends Error {
  readonly status = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "SessionAuthenticationError";
  }
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      const value = rawValue.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}
