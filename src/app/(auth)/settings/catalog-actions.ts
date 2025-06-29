
"use server";

import { addCatalogEntry, getFullCatalogHierarchy, updateCatalogEntry as updateCatalogEntryDb, deleteCatalogEntry as deleteCatalogEntryDb } from "@/lib/data";
import type { CatalogEntryType, CatalogHierarchyNode } from "@/types";
import { revalidatePath } from "next/cache";
import { type AddCatalogEntryInput, type ActionResult, AddCatalogEntrySchema, UpdateCatalogEntrySchema, type UpdateCatalogEntryData } from "./catalog.schema";

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
  // Ensure has_color_identifier is explicitly false for items if not provided, and undefined for categories
  const has_color_identifier = type === 'item' ? (validationResult.data.has_color_identifier ?? false) : undefined;


  if (type === "item" && (price === undefined || price <= 0)) {
    return {
      success: false,
      message: "Items must have a positive price.",
      errors: [{ path: ["price"], message: "Price must be a positive number for items.", code: "custom" }]
    };
  }

  try {
    const newEntryData = {
      name,
      parent_id,
      type: type as CatalogEntryType,
      price: type === "item" ? price : undefined,
      description,
      has_color_identifier: has_color_identifier, // Pass the processed value
    };
    
    const newEntry = await addCatalogEntry(newEntryData as any);
    
    revalidatePath("/settings");
    revalidatePath("/services");
    revalidatePath("/orders/new");

    return { success: true, message: `${type === 'category' ? 'Category' : 'Item'} "${name}" added successfully.`, newEntry };
  } catch (error: any) {
    const inputDataForLog = { name, parent_id, type, price, description, has_color_identifier };
    console.error("Error in addCatalogEntryAction. Input data was:", JSON.stringify(inputDataForLog, null, 2));
    console.error("Caught error details in action:", error);

    let userFriendlyMessage = error.message || `Failed to add ${type}. Please check server logs for more details.`;

    if (typeof error.message === 'string' && 
        (error.message.includes("Could not find the column") || error.message.includes("schema cache"))) {
      userFriendlyMessage = `Failed to add ${type}. The database schema might be out of sync. Please try reloading the schema in your Supabase project dashboard (API section -> Reload schema) and try again.`;
    }

    return { success: false, message: userFriendlyMessage };
  }
}

export async function updateCatalogEntryAction(entryId: string, data: UpdateCatalogEntryData): Promise<ActionResult> {
  const validationResult = UpdateCatalogEntrySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.issues,
      message: "Invalid update data.",
    };
  }
  
  try {
    // For items, default has_color_identifier to false if not provided
    const processedData = {
      ...validationResult.data,
      has_color_identifier: validationResult.data.has_color_identifier ?? false,
    };


    const updatedEntry = await updateCatalogEntryDb(entryId, {
      name: processedData.name,
      price: processedData.price, 
      description: processedData.description,
      has_color_identifier: processedData.has_color_identifier,
    });

    revalidatePath("/settings");
    revalidatePath("/services");
    revalidatePath("/orders/new");

    return { success: true, message: `Entry "${updatedEntry.name}" updated.`, updatedEntry };
  } catch (error: any) {
      console.error("Error updating catalog entry in action:", error);
     let userFriendlyMessage = error.message || "Failed to update entry.";
    if (typeof error.message === 'string' && 
        (error.message.includes("Could not find the column") || error.message.includes("schema cache"))) {
      userFriendlyMessage = `Failed to update entry. The database schema might be out of sync. Please try reloading the schema cache in your Supabase project dashboard (API section -> Reload schema) and try again.`;
    }
    return { success: false, message: userFriendlyMessage };
  }
}

export async function deleteCatalogEntryAction(entryId: string): Promise<ActionResult> {
  if (!entryId) {
    return { success: false, message: "Entry ID is required for deletion." };
  }
  try {
    const result = await deleteCatalogEntryDb(entryId);
    if (result.success) {
      revalidatePath("/settings");
      revalidatePath("/services");
      revalidatePath("/orders/new");
      return { success: true, message: result.message || "Entry deleted successfully." };
    } else {
      return { success: false, message: result.message || "Failed to delete entry." };
    }
  } catch (error: any) {
    console.error("Error deleting catalog entry in action:", error);
    return { success: false, message: error.message || "An unexpected error occurred during deletion." };
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
