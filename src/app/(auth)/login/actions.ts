
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
  // This will be handled when Supabase is fully integrated.
  const staffMember = await findStaff(validationResult.data.employeeId, validationResult.data.password);

  if (staffMember) {
    return {
      success: true,
      message: `Login successful! Welcome ${staffMember.name}. (Using mock store)`,
      // In a real app with Supabase, you'd set up a session here (e.g., with Supabase Auth)
    };
  } else {
    return {
      success: false,
      message: "Invalid Employee ID or Password. (Checked against mock store)",
    };
  }
}

export async function getQuickLoginStaffAction(): Promise<StaffCredentials[]> {
  return getQuickLoginStaffFromStore();
}
