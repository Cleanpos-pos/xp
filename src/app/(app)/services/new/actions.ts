"use server";

import { z } from "zod";

export const CreateServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export async function createServiceAction(data: CreateServiceInput) {
  const validationResult = CreateServiceSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  console.log("New service data:", validationResult.data);
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockServiceId = `serv-${Math.floor(Math.random() * 1000)}`;

  return {
    success: true,
    message: `Service ${validationResult.data.name} created successfully!`,
    serviceId: mockServiceId,
  };
}
