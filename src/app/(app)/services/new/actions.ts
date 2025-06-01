
"use server";

import { type CreateServiceInput, CreateServiceSchema } from "./service.schema";

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
