
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

  // NOTE: In a real app, password should be hashed here before comparing,
  // or the comparison should happen after retrieving the hashed password from DB.
  const staffMember = await findStaff(validationResult.data.employeeId, validationResult.data.password);

  if (staffMember) {
    return {
      success: true,
      message: `Login successful! Welcome ${staffMember.name}.`,
      // In a real app, you'd set up a session here (e.g., with cookies or a JWT)
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
