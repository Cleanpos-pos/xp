"use server";

import { z } from "zod";

const OrderItemSchema = z.object({
  serviceItemId: z.string().min(1, "Service item is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  dueDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Invalid due date",
  }),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export async function createOrderAction(data: CreateOrderInput) {
  const validationResult = CreateOrderSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  // Simulate API call or database insertion
  console.log("New order data:", validationResult.data);
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, you would save to DB and get an order ID
  const mockOrderId = `XP-${Math.floor(Math.random() * 100000)}`;

  return {
    success: true,
    message: `Order ${mockOrderId} created successfully!`,
    orderId: mockOrderId,
  };
}
