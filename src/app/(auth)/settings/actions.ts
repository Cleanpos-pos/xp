
"use server";

import { z } from "zod";

export const AddStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  loginId: z.string().min(3, "Login ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AddStaffInput = z.infer<typeof AddStaffSchema>;

export async function addStaffAction(data: AddStaffInput) {
  const validationResult = AddStaffSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid staff details.",
    };
  }

  // In a real app, you would save this to a database.
  // For now, we'll just log it.
  console.log("New staff member to add:", validationResult.data);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  return {
    success: true,
    message: `Staff member ${validationResult.data.name} with Login ID ${validationResult.data.loginId} details logged. (Mocked add)`,
  };
}
