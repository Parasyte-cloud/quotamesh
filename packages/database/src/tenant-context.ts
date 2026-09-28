import { sql } from "drizzle-orm";
import type { OrganizationId } from "@quotamesh/validation";
import { database, type DatabaseClient } from "./client";

export type TenantTransaction = Parameters<Parameters<DatabaseClient["db"]["transaction"]>[0]>[0];
export type TenantScope = <T>(
  organizationId: OrganizationId,
  fn: (tx: TenantTransaction) => Promise<T>,
) => Promise<T>;

export function createTenantScope(databaseClient: DatabaseClient): TenantScope {
  return async <T>(
    organizationId: OrganizationId,
    fn: (tx: TenantTransaction) => Promise<T>,
  ): Promise<T> => databaseClient.db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_organization_id', ${organizationId}, true)`,
    );
    return fn(tx);
  });
}

export async function withTenant<T>(
  organizationId: OrganizationId,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T> {
  if (!database) {
    throw new Error("DATABASE_URL is required for tenant-scoped database access");
  }

  return createTenantScope(database)(organizationId, fn);
}
