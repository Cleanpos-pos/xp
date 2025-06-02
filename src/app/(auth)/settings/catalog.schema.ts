
import { z } from "zod";
import type { CatalogEntry } from "@/types";

export const AddCatalogEntrySchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character").max(100, "Name too long"),
  parent_id: z.string().uuid("Invalid parent ID format.").nullable(),
  type: z.enum(["category", "item"]),
  price: z.coerce.number().optional(),
  description: z.string().max(500, "Description too long").optional(),
  has_color_identifier: z.boolean().optional(),
});

export type AddCatalogEntryInput = z.infer<typeof AddCatalogEntrySchema>;

export const UpdateCatalogEntrySchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character").max(100, "Name too long"),
  price: z.coerce.number().optional(), // Only applicable if type is 'item'
  description: z.string().max(500, "Description too long").optional(),
  has_color_identifier: z.boolean().optional(), // Only applicable if type is 'item'
});
export type UpdateCatalogEntryData = z.infer<typeof UpdateCatalogEntrySchema>;


export interface ActionResult {
  success: boolean;
  message?: string;
  errors?: z.ZodIssue[];
  newEntry?: CatalogEntry; // For add action
  updatedEntry?: CatalogEntry; // For update action
}

