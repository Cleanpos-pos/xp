
import { z } from "zod";

export const AddStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  loginId: z.string().min(3, "Login ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AddStaffInput = z.infer<typeof AddStaffSchema>;
