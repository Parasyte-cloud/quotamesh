import { createMiddleware } from "hono/factory";
import type { ApiEnv } from "../types";

export const requestIdMiddleware = createMiddleware<ApiEnv>(async (context, next) => {
  const inbound = context.req.header("x-request-id");
  const requestId = inbound && /^[A-Za-z0-9._:-]{1,128}$/u.test(inbound)
    ? inbound
    : crypto.randomUUID();

  context.set("requestId", requestId);
  await next();
  context.header("X-Request-ID", requestId);
});
