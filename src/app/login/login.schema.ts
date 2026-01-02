
import { z } from "zod";

export const LoginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"), // This maps to loginId
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
