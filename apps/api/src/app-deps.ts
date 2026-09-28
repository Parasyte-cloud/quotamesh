import type { SessionResolver } from "@quotamesh/auth";
import type { SiteRepository } from "./repositories/sites";

export interface Logger {
  warn(event: string, data: unknown): void;
  error(event: string, data: unknown): void;
}

export interface AppDependencies {
  resolveSession: SessionResolver;
  sites: SiteRepository;
  logger: Logger;
}
