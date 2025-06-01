"use server";

import { z } from "zod";

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required (e.g., pieces, kg, liters)"),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative").optional(),
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;

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
