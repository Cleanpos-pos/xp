
"use server";

import { type CreateOrderInput, CreateOrderSchema } from "./order.schema";

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
