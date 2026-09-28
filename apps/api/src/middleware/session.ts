import { requireSession, type SessionResolver } from "@quotamesh/auth";
import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../types";

export function createSessionMiddleware(resolveSession: SessionResolver) {
  return createMiddleware<ApiEnv>(async (context, next) => {
    const session = await requireSession(context.req.raw, resolveSession);
    context.set("session", session);
    await next();
  });
}
