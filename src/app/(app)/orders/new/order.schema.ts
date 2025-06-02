
import { z } from "zod";

export const OrderItemSchema = z.object({
  serviceItemId: z.string().min(1, "Service item is required"),
  serviceName: z.string().min(1, "Service name is required"),
  originalUnitPrice: z.coerce.number().positive("Original unit price must be a positive number").optional(), // Store the catalog price
  unitPrice: z.coerce.number().positive("Unit price must be a positive number"), // Price after manual override
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  itemDiscountAmount: z.coerce.number().min(0, "Discount amount cannot be negative").optional(),
  itemDiscountPercentage: z.coerce.number().min(0, "Percentage must be 0 or more").max(100, "Percentage cannot exceed 100").optional(),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  isExpress: z.boolean().optional(),
  cartDiscountAmount: z.coerce.number().min(0).optional(),
  cartDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
  cartPriceOverride: z.coerce.number().min(0).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
