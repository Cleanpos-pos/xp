"use server";

import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().refine(val => !val || /^[0-9\s-()+]+$/.test(val), {
    message: "Invalid phone number format",
  }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')), // Allow empty string or valid email
  address: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

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
