
"use server";

import { type CreateOrderInput, CreateOrderSchema } from "./new/order.schema";
import { createOrderDb, updateOrderStatusDb } from '@/lib/data'; // Import the Supabase function
import type { Order, OrderStatus } from "@/types"; // Import OrderStatus
import { revalidatePath } from 'next/cache';

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
    
    // Invalidate caches for the orders list and the new order's detail page
    revalidatePath('/orders');
    revalidatePath(`/orders/${newOrder.id}`);

    return {
      success: true,
      message: `Order ${newOrder.orderNumber} ${newOrder.isExpress ? '(Express) ' : ''}created successfully!`,
      orderId: newOrder.id, 
    };
  } catch (error: any) {
    console.error("Error creating order in action:", error);
    return {
      success: false,
      message: error.message || "Failed to create order.",
    };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus) {
  try {
    const { error } = await updateOrderStatusDb(orderId, newStatus);

    if (error) throw error;

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { success: true, message: `Order marked as ${newStatus}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
    