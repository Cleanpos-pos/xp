
"use server";

import { type CreateInventoryItemInput, CreateInventoryItemSchema } from "./inventory.schema";

export async function createInventoryItemAction(data: CreateInventoryItemInput) {
  const validationResult = CreateInventoryItemSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  console.log("New inventory item data:", validationResult.data);
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockInventoryItemId = `inv-${Math.floor(Math.random() * 1000)}`;

  return {
    success: true,
    message: `Inventory item ${validationResult.data.name} added successfully!`,
    inventoryItemId: mockInventoryItemId,
  };
}
