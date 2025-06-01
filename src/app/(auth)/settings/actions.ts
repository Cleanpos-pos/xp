
"use server";

import { 
  addStaff as addStaffToStore, 
  getAllStaff as getAllStaffFromStore,
  updateStaffQuickLoginStatus,
  type StaffCredentials
} from "@/lib/mock-auth-store";
import { type AddStaffInput, AddStaffSchema, type ToggleQuickLoginInput, ToggleQuickLoginSchema } from "./settings.schema";

export async function addStaffAction(data: AddStaffInput) {
  const validationResult = AddStaffSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid staff details.",
    };
  }

  addStaffToStore(validationResult.data);

  return {
    success: true,
    message: `Staff member ${validationResult.data.name} with Login ID ${validationResult.data.loginId} added. Quick login is initially disabled.`,
  };
}

export async function getAllStaffAction(): Promise<StaffCredentials[]> {
  return getAllStaffFromStore();
}

export async function toggleQuickLoginAction(data: ToggleQuickLoginInput) {
  const validationResult = ToggleQuickLoginSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, message: "Invalid input for quick login toggle." };
  }

  const success = updateStaffQuickLoginStatus(validationResult.data.loginId, validationResult.data.enable);
  
  if (success) {
    return { 
      success: true, 
      message: `Quick login for ${validationResult.data.loginId} ${validationResult.data.enable ? 'enabled' : 'disabled'}.` 
    };
  }
  return { 
    success: false, 
    message: "Failed to update quick login status. Staff member not found." 
  };
}
