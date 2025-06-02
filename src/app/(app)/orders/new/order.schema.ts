
import { z } from "zod";

export const OrderItemSchema = z.object({
  serviceItemId: z.string().min(1, "Service item is required"),
  serviceName: z.string().min(1, "Service name is required"), // Added
  unitPrice: z.coerce.number().positive("Unit price must be a positive number"), // Added
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  isExpress: z.boolean().optional(), // Added for express orders
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
