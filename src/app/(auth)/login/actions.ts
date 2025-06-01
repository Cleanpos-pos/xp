
"use server";

import { findStaff, getQuickLoginStaff as getQuickLoginStaffFromStore, type StaffCredentials } from "@/lib/mock-auth-store";
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

  const staffMember = findStaff(validationResult.data.employeeId, validationResult.data.password);

  if (staffMember) {
    return {
      success: true,
      message: `Login successful! Welcome ${staffMember.name}.`,
      // In a real app, you'd set up a session here (e.g., with cookies or a JWT)
      // Optionally, return staff details if needed by the client after login
      // staff: { name: staffMember.name, loginId: staffMember.loginId } 
    };
  } else {
    return {
      success: false,
      message: "Invalid Employee ID or Password.",
    };
  }
}

export async function getQuickLoginStaffAction(): Promise<StaffCredentials[]> {
  return getQuickLoginStaffFromStore();
}
