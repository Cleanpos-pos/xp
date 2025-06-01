
import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().refine(val => !val || /^[0-9\s-()+]+$/.test(val), {
    message: "Invalid phone number format",
  }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')), // Allow empty string or valid email
  address: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
