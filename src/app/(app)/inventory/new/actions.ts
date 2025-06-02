
"use server";

import { type CreateInventoryItemInput, CreateInventoryItemSchema } from "./inventory.schema";
import { createInventoryItemDb } from "@/lib/data"; // Use the new Supabase function
import type { InventoryItem } from "@/types";

export async function createInventoryItemAction(data: CreateInventoryItemInput) {
  const validationResult = CreateInventoryItemSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    // Prepare data for Supabase, ensuring lowStockThreshold is a number or undefined
    const itemDataForDb: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> = {
        name: validationResult.data.name,
        quantity: validationResult.data.quantity,
        unit: validationResult.data.unit,
        low_stock_threshold: validationResult.data.lowStockThreshold ?? 0, // Default to 0 if undefined
        last_restocked_at: null, // Or handle this if you add a date picker for it
    };
    
    const newInventoryItem = await createInventoryItemDb(itemDataForDb);

    return {
      success: true,
      message: `Inventory item ${newInventoryItem.name} added successfully to Supabase!`,
      inventoryItemId: newInventoryItem.id,
    };
  } catch (error: any) {
    console.error("Error creating inventory item in Supabase:", error);
    return {
      success: false,
      message: error.message || "Failed to add inventory item to Supabase.",
    };
  }
}
