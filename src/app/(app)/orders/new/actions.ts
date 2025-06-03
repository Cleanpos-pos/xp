
"use server";

import { type CreateOrderInput, CreateOrderSchema } from "./order.schema";
import { createOrderDb } from '@/lib/data'; // Import the Supabase function
import type { Order } from "@/types";

export async function createOrderAction(data: CreateOrderInput) {
  const validationResult = CreateOrderSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Validation failed. Please check the form.",
    };
  }

  try {
    const newOrder = await createOrderDb(validationResult.data);
    return {
      success: true,
      message: `Order ${newOrder.orderNumber} ${newOrder.isExpress ? '(Express) ' : ''}created successfully in Supabase!`,
      orderId: newOrder.id, // Return the actual ID from Supabase
    };
  } catch (error: any) {
    console.error("Error creating order in action:", error);
    return {
      success: false,
      message: error.message || "Failed to create order in Supabase.",
    };
  }
}

    