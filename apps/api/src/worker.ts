import { createApp } from "./app";
import { createRuntime } from "./runtime";
import type { ApiBindings } from "./types";

let cachedKey: string | undefined;
let cachedApp: ReturnType<typeof createApp> | undefined;

function runtimeKey(bindings: ApiBindings): string | undefined {
  const auth = bindings.QUOTAMESH_AUTH_HYPERDRIVE?.connectionString;
  const tenant = bindings.QUOTAMESH_TENANT_HYPERDRIVE?.connectionString;
  if (!auth || !tenant) return undefined;
  return `${auth}\n${tenant}`;
}

function appFor(bindings: ApiBindings) {
  const key = runtimeKey(bindings);
  if (!cachedApp || !key || key !== cachedKey) {
    cachedApp = createApp(createRuntime(bindings));
    cachedKey = key;
  }
  return cachedApp;
}

export default {
  fetch(request: Request, env: ApiBindings): Promise<Response> {
    return Promise.resolve(appFor(env).fetch(request, env));
  },
};
