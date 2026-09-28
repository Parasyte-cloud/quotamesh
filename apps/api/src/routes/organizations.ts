import { Hono } from "hono";
import type { ApiEnv } from "../types";

export const organizationRoutes = new Hono<ApiEnv>().get("/organization", (context) => {
  const session = context.get("session");
  return context.json({ data: { organizationId: session.organizationId } });
});
