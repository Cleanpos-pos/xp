
"use server";

import { type CreateCustomerInput, CreateCustomerSchema } from "./customer.schema";
import { addMockCustomer } from "@/lib/data";

export async function createCustomerAction(data: CreateCustomerInput) {
  const validationResult = CreateCustomerSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  // Add to the in-memory mock store
  const newCustomer = addMockCustomer(validationResult.data);

  // Simulate some delay if needed, though addMockCustomer is synchronous
  // await new Promise(resolve => setTimeout(resolve, 100)); 

  return {
    success: true,
    message: `Customer ${newCustomer.name} created successfully!`,
    customerId: newCustomer.id, // Use the ID from the newly added customer
  };
}
