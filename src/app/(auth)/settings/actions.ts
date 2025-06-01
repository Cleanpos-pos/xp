
"use server";

import { addStaff as addStaffToStore } from "@/lib/mock-auth-store";
import { type AddStaffInput, AddStaffSchema } from "./settings.schema";

export async function addStaffAction(data: AddStaffInput) {
  const validationResult = AddStaffSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid staff details.",
    };
  }

  // Check if staff already exists in our mock store
  // Note: findStaff is not imported here to avoid circular dependency if it were in the same file or complex setup
  // For this simple mock store, we can rely on the store's own logic or duplicate a simple check if needed.
  // The addStaffToStore function in mock-auth-store already has a basic check.

  addStaffToStore(validationResult.data);
  // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay - can be removed if not needed

  return {
    success: true,
    message: `Staff member ${validationResult.data.name} with Login ID ${validationResult.data.loginId} added.`,
  };
}
