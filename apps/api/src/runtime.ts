import { createDatabase, createTenantScope } from "@quotamesh/database";
import type { AppDependencies, Logger } from "./app-deps";
import { createPostgresSessionResolver } from "./repositories/sessions";
import { createSiteRepository } from "./repositories/sites";
import type { ApiBindings, HyperdriveBinding } from "./types";

const runtimeLogger: Logger = {
  warn(event, data) {
    console.warn(event, data);
  },
  error(event, data) {
    console.error(event, data);
  },
};

function requireBinding(
  bindings: ApiBindings,
  name: "QUOTAMESH_AUTH_HYPERDRIVE" | "QUOTAMESH_TENANT_HYPERDRIVE",
): HyperdriveBinding {
  const binding = bindings[name];
  if (!binding) throw new Error(`${name} binding is required`);
  if (!binding.connectionString.trim()) {
    throw new Error(`${name} connection string is required`);
  }
  return binding;
}

export function createRuntime(bindings: ApiBindings): AppDependencies {
  const authBinding = requireBinding(bindings, "QUOTAMESH_AUTH_HYPERDRIVE");
  const tenantBinding = requireBinding(bindings, "QUOTAMESH_TENANT_HYPERDRIVE");

  const authDatabase = createDatabase(authBinding.connectionString);
  const tenantDatabase = createDatabase(tenantBinding.connectionString);
  const tenantScope = createTenantScope(tenantDatabase);

  return {
    resolveSession: createPostgresSessionResolver(authDatabase),
    sites: createSiteRepository(tenantScope),
    logger: runtimeLogger,
  };
}
