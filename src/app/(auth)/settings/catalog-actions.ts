
"use server";

import { z } from "zod";
import { addCatalogEntry, getFullCatalogHierarchy } from "@/lib/data"; // Uses Supabase now
import type { CatalogEntry, CatalogEntryType, CatalogHierarchyNode } from "@/types";
import { revalidatePath } from "next/cache";

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

export async function addCatalogEntryAction(data: AddCatalogEntryInput): Promise<ActionResult> {
  const validationResult = AddCatalogEntrySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.issues,
      message: "Invalid input."
    };
  }

  const { name, parent_id, type, price, description } = validationResult.data;

  if (type === "item" && (price === undefined || price <= 0)) {
    return {
      success: false,
      message: "Items must have a positive price.",
      errors: [{ path: ["price"], message: "Price must be a positive number for items.", code: "custom" }]
    };
  }

  try {
    const newEntry = await addCatalogEntry({ 
      name,
      parent_id, 
      type: type as CatalogEntryType, 
      price: type === "item" ? price : undefined,
      description,
    });
    revalidatePath("/settings"); 
    return { success: true, message: `${type === 'category' ? 'Category' : 'Item'} "${name}" added successfully.`, newEntry };
  } catch (error: any) {
    const inputDataForLog = { name, parent_id, type, price, description };
    console.error("Error in addCatalogEntryAction. Input data was:", JSON.stringify(inputDataForLog, null, 2));
    console.error("Caught error details in action:", error); // Log the full error object
    return { success: false, message: error.message || `Failed to add ${type}. Please check server logs for more details.` };
  }
}

export async function getCatalogHierarchyAction(): Promise<CatalogHierarchyNode[]> {
  try {
    const hierarchy = await getFullCatalogHierarchy(); 
    return hierarchy;
  } catch (error) {
    console.error("Error fetching catalog hierarchy in action:", error);
    return [];
  }
}
