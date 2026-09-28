import { sql } from "drizzle-orm";
import type { OrganizationId } from "@quotamesh/validation";
import { database } from "./client";

export type TenantTransaction = Parameters<Parameters<NonNullable<typeof database>["db"]["transaction"]>[0]>[0];

export async function withTenant<T>(
  organizationId: OrganizationId,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T> {
  if (!database) {
    throw new Error("DATABASE_URL is required for tenant-scoped database access");
  }

  return database.db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_organization_id', ${organizationId}, true)`,
    );
    return fn(tx);
  });
}
