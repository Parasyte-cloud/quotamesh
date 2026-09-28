import { z } from "zod";
import { OrganizationIdSchema, SiteIdSchema } from "./identifiers";

export { OrganizationIdSchema, SiteIdSchema } from "./identifiers";
export type { OrganizationId, SiteId } from "./identifiers";

export const TenantContextSchema = z.object({
  organizationId: OrganizationIdSchema,
  siteId: SiteIdSchema.optional(),
}).strict();

export type TenantContext = z.infer<typeof TenantContextSchema>;
