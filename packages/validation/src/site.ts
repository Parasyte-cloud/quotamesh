import { z } from "zod";

export const NetworkVendorSchema = z.enum(["unifi", "meraki", "mikrotik"]);

export const CreateSiteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  vendor: NetworkVendorSchema,
  timezone: z.string().trim().min(1).max(100),
}).strict();

export type CreateSiteInput = z.infer<typeof CreateSiteSchema>;
export type NetworkVendor = z.infer<typeof NetworkVendorSchema>;
