
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

export const LoginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
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

  // Mock authentication
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  if (
    validationResult.data.employeeId === "STAFF001" &&
    validationResult.data.password === "password"
  ) {
    // In a real app, you'd set up a session here (e.g., with cookies or a JWT)
    // For this prototype, we'll just return success.
    // The redirect will happen on the client-side based on this success.
    return {
      success: true,
      message: "Login successful!",
    };
  } else {
    return {
      success: false,
      message: "Invalid Employee ID or Password.",
    };
  }
}
