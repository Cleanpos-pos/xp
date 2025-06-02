
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
  console.log("New order data:", validationResult.data); // Includes isExpress if provided
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockOrderIndex = Math.floor(Math.random() * 100);
  const mockOrderId = generateOrderNumber(mockOrderIndex, new Date());


  return {
    success: true,
    message: `Order ${mockOrderId} ${validationResult.data.isExpress ? '(Express) ' : ''}created successfully!`,
    orderId: mockOrderId,
    // In a real scenario, you'd also pass back the isExpress status or the full order object
  };
}
