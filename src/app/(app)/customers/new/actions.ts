
"use server";

import { type CreateCustomerInput, CreateCustomerSchema } from "./customer.schema";

export async function createCustomerAction(data: CreateCustomerInput) {
  const validationResult = CreateCustomerSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  console.log("New customer data:", validationResult.data);
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockCustomerId = `cust-${Math.floor(Math.random() * 1000)}`;

  return {
    success: true,
    message: `Customer ${validationResult.data.name} created successfully!`,
    customerId: mockCustomerId,
  };
}
