import { AuthorizationError, SessionAuthenticationError } from "@quotamesh/auth";
import { redactSecrets } from "@quotamesh/config";
import { Hono } from "hono";
import type { AppDependencies } from "./app-deps";
import { requestIdMiddleware } from "./middleware/request-id";
import { securityMiddleware } from "./middleware/security";
import { createSessionMiddleware } from "./middleware/session";
import { healthRoutes } from "./routes/health";
import { organizationRoutes } from "./routes/organizations";
import { createSiteRoutes } from "./routes/sites";
import type { ApiEnv } from "./types";

export function createApp(dependencies: AppDependencies) {
  const app = new Hono<ApiEnv>();

  app.use("*", requestIdMiddleware);
  app.use("*", securityMiddleware);
  app.route("/", healthRoutes);

  app.use("/v1/*", createSessionMiddleware(dependencies.resolveSession));
  app.route("/v1", organizationRoutes);
  app.route("/v1", createSiteRoutes(dependencies.sites, dependencies.logger));

  app.notFound((context) => context.json({ error: "Not found" }, 404));

  app.onError((error, context) => {
    if (error instanceof SessionAuthenticationError) {
      return context.json({ error: "Authentication required" }, 401);
    }
    if (error instanceof AuthorizationError) {
      return context.json({ error: "Forbidden" }, 403);
    }

    dependencies.logger.error("request.failed", redactSecrets({
      requestId: context.get("requestId"),
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
    }));
    return context.json({ error: "Internal server error" }, 500);
  });

  return app;
}
