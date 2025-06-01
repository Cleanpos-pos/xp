
import { z } from "zod";

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required (e.g., pieces, kg, liters)"),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative").optional(),
});

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
