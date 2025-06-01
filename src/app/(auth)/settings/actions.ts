
"use server";

import { 
  addStaff as addStaffToStore, 
  getAllStaff as getAllStaffFromStore,
  updateStaffQuickLoginStatus,
  type StaffCredentials
} from "@/lib/mock-auth-store"; // This now points to mock in-memory functions
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

  try {
    // NOTE: In a real app with Supabase, hash the password before storing.
    // This will be handled during Supabase integration.
    await addStaffToStore({
      name: validationResult.data.name,
      loginId: validationResult.data.loginId,
      password: validationResult.data.password, // Storing plain text for prototype - HASH IN PRODUCTION!
      enableQuickLogin: false, // Default for new staff
    });
    return {
      success: true,
      message: `Staff member ${validationResult.data.name} with Login ID ${validationResult.data.loginId} added to mock store. Quick login is initially disabled.`,
    };
  } catch (error: any) {
    console.error("Error adding staff to mock store:", error);
    return {
      success: false,
      message: error.message || "Failed to add staff member to mock store.",
    };
  }
}

export async function getAllStaffAction(): Promise<StaffCredentials[]> {
  try {
    return await getAllStaffFromStore();
  } catch (error) {
    console.error("Error fetching staff list from mock store:", error);
    return []; 
  }
}

export async function toggleQuickLoginAction(data: ToggleQuickLoginInput) {
  const validationResult = ToggleQuickLoginSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, message: "Invalid input for quick login toggle." };
  }

  try {
    const success = await updateStaffQuickLoginStatus(validationResult.data.loginId, validationResult.data.enable);
    
    if (success) {
      return { 
        success: true, 
        message: `Quick login for ${validationResult.data.loginId} ${validationResult.data.enable ? 'enabled' : 'disabled'} in mock store.` 
      };
    }
    return { 
      success: false, 
      message: "Failed to update quick login status in mock store. Staff member may not exist." 
    };
  } catch (error: any) {
    console.error("Error toggling quick login in mock store:", error);
    return {
      success: false,
      message: error.message || "Failed to toggle quick login status in mock store.",
    };
  }
}
