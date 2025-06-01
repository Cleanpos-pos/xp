
"use server";

import { z } from "zod";
import { addCatalogEntry, getFullCatalogHierarchy } from "@/lib/data";
import type { CatalogEntry, CatalogEntryType, CatalogHierarchyNode } from "@/types";
import { revalidatePath } from "next/cache";

export const AddCatalogEntrySchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character").max(100, "Name too long"),
  parentId: z.string().nullable(),
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

  const { name, parentId, type, price, description } = validationResult.data;

  if (type === "item" && (price === undefined || price <= 0)) {
    return {
      success: false,
      message: "Items must have a positive price.",
      errors: [{ path: ["price"], message: "Price must be a positive number for items.", code: "custom" }] // Match ZodIssue structure
    };
  }

  try {
    // Ensure the call to addCatalogEntry is awaited if it's async
    const newEntry = await addCatalogEntry({
      name,
      parentId,
      type: type as CatalogEntryType, 
      price: type === "item" ? price : undefined,
      description,
    });
    revalidatePath("/settings"); 
    return { success: true, message: `${type === 'category' ? 'Category' : 'Item'} "${name}" added successfully.`, newEntry };
  } catch (error: any) {
    console.error("Error in addCatalogEntryAction:", error); // Log the actual error
    return { success: false, message: error.message || `Failed to add ${type}.` };
  }
}

export async function getCatalogHierarchyAction(): Promise<CatalogHierarchyNode[]> {
  try {
    // Ensure the call to getFullCatalogHierarchy is awaited if it's async
    const hierarchy = await getFullCatalogHierarchy();
    return hierarchy;
  } catch (error) {
    console.error("Error fetching catalog hierarchy:", error);
    return [];
  }
}

    