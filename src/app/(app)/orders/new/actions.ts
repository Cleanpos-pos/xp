
"use server";

import { type CreateOrderInput, CreateOrderSchema } from "./order.schema";
import { generateOrderNumber } from '@/lib/data'; // Import the updated generator

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

  // Use the new generateOrderNumber function for the mock order ID
  // It needs an index, for mock purposes we can use a random number or a static one.
  // Since it's mock, a random small number for index should suffice.
  const mockOrderIndex = Math.floor(Math.random() * 100);
  const mockOrderId = generateOrderNumber(mockOrderIndex, new Date());


  return {
    success: true,
    message: `Order ${mockOrderId} created successfully!`,
    orderId: mockOrderId,
  };
}
