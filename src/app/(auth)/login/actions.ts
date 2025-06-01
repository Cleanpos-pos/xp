
"use server";

import { findStaff, getQuickLoginStaff, type StaffCredentials } from "@/lib/mock-auth-store"; // Now uses Supabase
import { LoginSchema, type LoginInput } from "./login.schema";

export async function loginAction(data: LoginInput) {
  const validationResult = LoginSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid input.",
    };
  }

  try {
    // mock-auth-store's findStaff now interacts with Supabase
    const staffMember = await findStaff(validationResult.data.employeeId, validationResult.data.password);

    if (staffMember) {
      return {
        success: true,
        message: `Login successful! Welcome ${staffMember.name}. (Using Supabase)`,
        // In a real app with Supabase Auth, you'd set up a session here
      };
    } else {
      return {
        success: false,
        message: "Invalid Employee ID or Password. (Checked against Supabase)",
      };
    }
  } catch (error: any) {
    console.error("Login Action Error:", error);
    return {
      success: false,
      message: error.message || "An error occurred during login.",
    };
  }
}

export async function getQuickLoginStaffAction(): Promise<StaffCredentials[]> {
  // mock-auth-store's getQuickLoginStaff now interacts with Supabase
  try {
    return await getQuickLoginStaff();
  } catch (error) {
    console.error("Error fetching quick login staff in action:", error);
    return []; // Return empty array on error
  }
}
