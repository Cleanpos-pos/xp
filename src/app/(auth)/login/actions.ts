
"use server";

import { z } from "zod";
import { findStaff } from "@/lib/mock-auth-store";

export const LoginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"), // This maps to loginId
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function loginAction(data: LoginInput) {
  const validationResult = LoginSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Invalid input.",
    };
  }

  // Simulate network delay if desired
  // await new Promise(resolve => setTimeout(resolve, 1000));

  const staffMember = findStaff(validationResult.data.employeeId, validationResult.data.password);

  if (staffMember) {
    // In a real app, you'd set up a session here (e.g., with cookies or a JWT)
    return {
      success: true,
      message: `Login successful! Welcome ${staffMember.name}.`,
    };
  } else {
    return {
      success: false,
      message: "Invalid Employee ID or Password.",
    };
  }
}
