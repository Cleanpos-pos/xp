
"use server";

import { type CreateCustomerInput, CreateCustomerSchema } from "./customer.schema";
import { createCustomer as createCustomerInDb } from "@/lib/data"; // Now uses Supabase

export async function createCustomerAction(data: CreateCustomerInput) {
  const validationResult = CreateCustomerSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    // createCustomerInDb now interacts with Supabase
    const newCustomer = await createCustomerInDb(validationResult.data);

    return {
      success: true,
      message: `Customer ${newCustomer.name} created successfully in Supabase!`,
      customerId: newCustomer.id, 
    };
  } catch (error: any) {
    console.error("Error creating customer in action:", error);
    return {
      success: false,
      message: error.message || "Failed to create customer in Supabase.",
    };
  }
}
