import type { AuthenticatedSession } from "@quotamesh/auth";

export type ApiVariables = {
  session: AuthenticatedSession;
  requestId: string;
};

export interface HyperdriveBinding {
  connectionString: string;
}

export type ApiBindings = {
  QUOTAMESH_AUTH_HYPERDRIVE?: HyperdriveBinding;
  QUOTAMESH_TENANT_HYPERDRIVE?: HyperdriveBinding;
};

export type ApiEnv = {
  Bindings: ApiBindings;
  Variables: ApiVariables;
};
