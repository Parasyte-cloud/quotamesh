import { requirePermission } from "@quotamesh/auth";
import { redactSecrets } from "@quotamesh/config";
import { CreateSiteSchema, SiteIdSchema } from "@quotamesh/validation";
import { Hono } from "hono";
import type { Logger } from "../app-deps";
import type { SiteRepository } from "../repositories/sites";
import type { ApiEnv } from "../types";

export function createSiteRoutes(repository: SiteRepository, logger: Logger) {
  const routes = new Hono<ApiEnv>();

  routes.get("/sites", async (context) => {
    const session = context.get("session");
    requirePermission(session, "sites.read");
    return context.json({ data: await repository.list(session.organizationId) });
  });

  routes.get("/sites/:siteId", async (context) => {
    const session = context.get("session");
    requirePermission(session, "sites.read");
    const parsedId = SiteIdSchema.safeParse(context.req.param("siteId"));
    if (!parsedId.success) return context.json({ error: "Invalid site identifier" }, 400);

    const site = await repository.getById(session.organizationId, parsedId.data);
    if (!site) return context.json({ error: "Site not found" }, 404);
    return context.json({ data: site });
  });

  routes.post("/sites", async (context) => {
    const session = context.get("session");
    requirePermission(session, "sites.create");

    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = CreateSiteSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("site.create.rejected", {
        requestId: context.get("requestId"),
        body: redactSecrets(body),
      });
      return context.json({ error: "Invalid site input" }, 400);
    }

    const site = await repository.create(session.organizationId, parsed.data);
    return context.json({ data: site }, 201);
  });

  return routes;
}
