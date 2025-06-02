
"use server";

import {
  addStaff as addStaffToDb,
  getAllStaff as getAllStaffFromDb,
  updateStaffQuickLoginStatus,
  deleteStaff as deleteStaffFromDb,
  updateStaffActiveStatus, // Import new function
} from "@/lib/mock-auth-store";
import type { StaffCredentials } from "@/types"; // Use StaffCredentials from @/types
import { type AddStaffInput, AddStaffSchema, type ToggleQuickLoginInput, ToggleQuickLoginSchema, type ToggleStaffActiveStatusInput, ToggleStaffActiveStatusSchema } from "./settings.schema";

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
    await addStaffToDb({
      name: validationResult.data.name,
      login_id: validationResult.data.loginId,
      password: validationResult.data.password,
      role: validationResult.data.role, // Pass the role
      enable_quick_login: false, // Default for new staff
      // is_active will be true by default in DB
    });
    return {
      success: true,
      message: `Staff member ${validationResult.data.name} (Role: ${validationResult.data.role}) with Login ID ${validationResult.data.loginId} added to Supabase. Quick login is initially disabled. Account is active.`,
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

  const { loginId, enable } = validationResult.data;
  console.log(`[toggleQuickLoginAction] Validated data - Login ID: '${loginId}', Enable: ${enable}`);

  try {
    const success = await updateStaffQuickLoginStatus(loginId, enable);

    if (success) {
      return {
        success: true,
        message: `Quick login for ${loginId} ${enable ? 'enabled' : 'disabled'} in Supabase.`
      };
    }
    return {
      success: false,
      message: `Failed to update quick login status for ${loginId} in Supabase. The staff member might not exist or the update operation affected 0 rows.`
    };
  } catch (error: any) {
    console.error("Error toggling quick login in Supabase via action:", error);
    return {
      success: false,
      message: error.message || `Failed to toggle quick login status for ${loginId} in Supabase due to an error.`,
    };
  }
}

export async function toggleStaffActiveStatusAction(data: ToggleStaffActiveStatusInput) {
  const validationResult = ToggleStaffActiveStatusSchema.safeParse(data);
  if (!validationResult.success) {
    return { success: false, message: "Invalid input for active status toggle." };
  }

  const { loginId, isActive } = validationResult.data;
  console.log(`[toggleStaffActiveStatusAction] Validated data - Login ID: '${loginId}', IsActive: ${isActive}`);

  try {
    const success = await updateStaffActiveStatus(loginId, isActive);

    if (success) {
      return {
        success: true,
        message: `Staff member ${loginId} ${isActive ? 'activated' : 'deactivated'} in Supabase.`
      };
    }
    return {
      success: false,
      message: `Failed to update active status for ${loginId} in Supabase. The staff member might not exist or the update operation affected 0 rows.`
    };
  } catch (error: any) {
    console.error("Error toggling active status in Supabase via action:", error);
    return {
      success: false,
      message: error.message || `Failed to toggle active status for ${loginId} in Supabase due to an error.`,
    };
  }
}


export async function removeStaffAction(loginId: string) {
  if (!loginId || typeof loginId !== 'string' || loginId.trim() === '') {
    return { success: false, message: "Invalid Login ID provided for removal." };
  }
  console.log(`[removeStaffAction] Attempting to remove staff with Login ID: '${loginId}'`);
  try {
    const success = await deleteStaffFromDb(loginId);
    if (success) {
      return { success: true, message: `Staff member with Login ID ${loginId} removed successfully.` };
    } else {
      return { success: false, message: `Could not remove staff member with Login ID ${loginId}. They may not exist or another error occurred.` };
    }
  } catch (error: any) {
    console.error(`Error removing staff ${loginId} via action:`, error);
    return { success: false, message: error.message || "An unexpected error occurred while trying to remove staff." };
  }
}
