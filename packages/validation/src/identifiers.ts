import { z } from "zod";

export const OrganizationIdSchema = z.string().uuid().brand<"OrganizationId">();
export const SiteIdSchema = z.string().uuid().brand<"SiteId">();

export type OrganizationId = z.infer<typeof OrganizationIdSchema>;
export type SiteId = z.infer<typeof SiteIdSchema>;
