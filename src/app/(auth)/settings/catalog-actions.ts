
"use server";

import { addCatalogEntry, getFullCatalogHierarchy } from "@/lib/data";
import type { CatalogEntryType, CatalogHierarchyNode } from "@/types";
import { revalidatePath } from "next/cache";
import { type AddCatalogEntryInput, type ActionResult, AddCatalogEntrySchema } from "./catalog.schema";

export async function addCatalogEntryAction(data: AddCatalogEntryInput): Promise<ActionResult> {
  const validationResult = AddCatalogEntrySchema.safeParse(data);
  if (!validationResult.success) {
    console.error("Validation failed in addCatalogEntryAction:", JSON.stringify(validationResult.error.issues, null, 2));
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
    // The addCatalogEntry function in lib/data.ts expects Omit<CatalogEntry, 'id' | 'created_at' | 'updated_at' | 'sort_order'>
    // It internally calculates sort_order.
    const newEntryData = {
      name,
      parent_id,
      type: type as CatalogEntryType, // Zod enum ensures this is valid
      price: type === "item" ? price : undefined, // Price only for items
      description,
      // sort_order will be handled by addCatalogEntry in lib/data.ts
    };
    
    const newEntry = await addCatalogEntry(newEntryData as any); // Cast as any if precise Omit type causes issues, or refine type
    
    revalidatePath("/settings");
    revalidatePath("/services");
    revalidatePath("/orders/new");

    return { success: true, message: `${type === 'category' ? 'Category' : 'Item'} "${name}" added successfully.`, newEntry };
  } catch (error: any) {
    const inputDataForLog = { name, parent_id, type, price, description };
    console.error("Error in addCatalogEntryAction. Input data was:", JSON.stringify(inputDataForLog, null, 2));
    console.error("Caught error details in action:", error);
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
