
"use server";

import { 
  addStaff as addStaffToDb, 
  getAllStaff as getAllStaffFromDb,
  updateStaffQuickLoginStatus,
  type StaffCredentials // This interface is now in mock-auth-store.ts
} from "@/lib/mock-auth-store"; // This now points to Supabase functions
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
    // addStaffToDb now interacts with Supabase
    // The password from AddStaffInput is 'password', which addStaffToDb expects
    await addStaffToDb({
      name: validationResult.data.name,
      login_id: validationResult.data.loginId, // Map to snake_case for the function
      password: validationResult.data.password, 
      enable_quick_login: false, // Default for new staff
    });
    return {
      success: true,
      message: `Staff member ${validationResult.data.name} with Login ID ${validationResult.data.loginId} added to Supabase. Quick login is initially disabled.`,
    };
  } catch (error: any) {
    console.error("Error adding staff to Supabase via action:", error);
    return {
      success: false,
      message: error.message || "Failed to add staff member to Supabase.",
    };
  }
}

export async function getAllStaffAction(): Promise<StaffCredentials[]> {
  try {
    // getAllStaffFromDb now interacts with Supabase
    return await getAllStaffFromDb();
  } catch (error) {
    console.error("Error fetching staff list from Supabase via action:", error);
    return []; 
  }
}

export async function toggleQuickLoginAction(data: ToggleQuickLoginInput) {
  const validationResult = ToggleQuickLoginSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, message: "Invalid input for quick login toggle." };
  }

  try {
    // updateStaffQuickLoginStatus now interacts with Supabase
    // data.loginId maps to login_id parameter expected by updateStaffQuickLoginStatus
    const success = await updateStaffQuickLoginStatus(validationResult.data.loginId, validationResult.data.enable);
    
    if (success) {
      return { 
        success: true, 
        message: `Quick login for ${validationResult.data.loginId} ${validationResult.data.enable ? 'enabled' : 'disabled'} in Supabase.` 
      };
    }
    return { 
      success: false, 
      message: "Failed to update quick login status in Supabase. Staff member may not exist." 
    };
  } catch (error: any) {
    console.error("Error toggling quick login in Supabase via action:", error);
    return {
      success: false,
      message: error.message || "Failed to toggle quick login status in Supabase.",
    };
  }
}
