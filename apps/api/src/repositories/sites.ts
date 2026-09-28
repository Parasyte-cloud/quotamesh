import { and, eq } from "drizzle-orm";
import { sites, withTenant, type Site, type TenantScope } from "@quotamesh/database";
import type { CreateSiteInput, OrganizationId, SiteId } from "@quotamesh/validation";

export interface SiteRepository {
  list(organizationId: OrganizationId): Promise<Site[]>;
  getById(organizationId: OrganizationId, siteId: SiteId): Promise<Site | null>;
  create(organizationId: OrganizationId, input: CreateSiteInput): Promise<Site>;
}

export function createSiteRepository(runWithTenant: TenantScope = withTenant): SiteRepository {
  return {
    list: (organizationId) => runWithTenant(organizationId, async (tx) =>
      tx.select().from(sites).where(eq(sites.organizationId, organizationId))),

    getById: (organizationId, siteId) => runWithTenant(organizationId, async (tx) => {
      const [site] = await tx
        .select()
        .from(sites)
        .where(and(eq(sites.organizationId, organizationId), eq(sites.siteId, siteId)))
        .limit(1);
      return site ?? null;
    }),

    create: (organizationId, input) => runWithTenant(organizationId, async (tx) => {
      const [site] = await tx
        .insert(sites)
        .values({ ...input, organizationId })
        .returning();
      if (!site) throw new Error("Site creation did not return a record");
      return site;
    }),
  };
}
