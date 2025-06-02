
import { z } from "zod";
import type { UserRole } from "@/types";

export const AddStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  loginId: z.string().min(3, "Login ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["clerk", "admin", "super_admin"], {
    required_error: "Role is required",
  }) satisfies z.ZodType<UserRole>,
});

export type AddStaffInput = z.infer<typeof AddStaffSchema>;

export const ToggleQuickLoginSchema = z.object({
  loginId: z.string().min(1, "Login ID is required"),
  enable: z.boolean(),
});
export type ToggleQuickLoginInput = z.infer<typeof ToggleQuickLoginSchema>;

export const ToggleStaffActiveStatusSchema = z.object({
  loginId: z.string().min(1, "Login ID is required"),
  isActive: z.boolean(),
});
export type ToggleStaffActiveStatusInput = z.infer<typeof ToggleStaffActiveStatusSchema>;


export const UpdateCustomerAccountDetailsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID."),
  is_account_client: z.boolean().optional(),
  account_id: z.string().max(50, "Account ID too long").nullable().optional(),
});
export type UpdateCustomerAccountDetailsInput = z.infer<typeof UpdateCustomerAccountDetailsSchema>;
