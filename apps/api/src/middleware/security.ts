import { securityHeaders } from "@quotamesh/config";
import { createMiddleware } from "hono/factory";

export const securityMiddleware = createMiddleware(async (context, next) => {
  await next();
  for (const [name, value] of Object.entries(securityHeaders)) {
    context.header(name, value);
  }
});
