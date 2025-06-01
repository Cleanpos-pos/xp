
import { z } from "zod";
import type { CatalogEntry } from "@/types";

export const AddCatalogEntrySchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character").max(100, "Name too long"),
  parent_id: z.string().uuid("Invalid parent ID format.").nullable(),
  type: z.enum(["category", "item"]),
  price: z.coerce.number().optional(),
  description: z.string().max(500, "Description too long").optional(),
});

export type AddCatalogEntryInput = z.infer<typeof AddCatalogEntrySchema>;

export interface ActionResult {
  success: boolean;
  message?: string;
  errors?: z.ZodIssue[];
  newEntry?: CatalogEntry;
}
