import type { AuthenticatedSession } from "@quotamesh/auth";

export type ApiVariables = {
  session: AuthenticatedSession;
  requestId: string;
};

export type ApiEnv = {
  Variables: ApiVariables;
};
