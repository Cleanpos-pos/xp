
"use server";

import { z } from "zod";
import { addCatalogEntry, getFullCatalogHierarchy } from "@/lib/data"; // Using mock data for now
import type { CatalogEntry, CatalogEntryType, CatalogHierarchyNode } from "@/types";
import { revalidatePath } from "next/cache";

export const AddCatalogEntrySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  parentId: z.string().nullable(),
  type: z.enum(["category", "item"]),
  price: z.coerce.number().optional(),
  description: z.string().optional(),
});

export type AddCatalogEntryInput = z.infer<typeof AddCatalogEntrySchema>;

interface ActionResult {
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
      errors: [{ path: ["price"], message: "Price must be a positive number for items.", code: "custom" }]
    };
  }

  try {
    const newEntry = await addCatalogEntry({
      name,
      parentId,
      type: type as CatalogEntryType, // Ensure type is correctly cast
      price: type === "item" ? price : undefined,
      description,
    });
    revalidatePath("/settings"); // Revalidate to show new entry
    return { success: true, message: `${type === 'category' ? 'Category' : 'Item'} "${name}" added successfully.`, newEntry };
  } catch (error: any) {
    return { success: false, message: error.message || `Failed to add ${type}.` };
  }
}

export async function getCatalogHierarchyAction(): Promise<CatalogHierarchyNode[]> {
  try {
    return await getFullCatalogHierarchy();
  } catch (error) {
    console.error("Error fetching catalog hierarchy:", error);
    return [];
  }
}
