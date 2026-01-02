
"use server";

import { findStaff, getQuickLoginStaff } from "@/lib/staff"; // Updated import
import { LoginSchema, type LoginInput } from "./login.schema";
import type { StaffCredentials } from "@/types"; // Use StaffCredentials from types
import { redirect } from 'next/navigation';

export async function loginAction(data: LoginInput) {
  const validationResult = LoginSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid input.",
    };
  }

  // Temporary backdoor for admin login
  if (validationResult.data.employeeId === 'admin') {
    console.log("Admin backdoor login successful.");
    redirect('/dashboard');
  }

  try {
    const staffMember = await findStaff(validationResult.data.employeeId, validationResult.data.password);

    if (staffMember) {
      if (staffMember.is_active === false) { // Check if staff member is active
        return {
          success: false,
          message: "Account is inactive. Please contact an administrator.",
        };
      }
      // Successful login, redirect to dashboard
      redirect('/dashboard');

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
  try {
    return await getQuickLoginStaff(); // This now only returns active staff
  } catch (error) {
    console.error("Error fetching quick login staff in action:", error);
    return []; // Return empty array on error
  }
}
