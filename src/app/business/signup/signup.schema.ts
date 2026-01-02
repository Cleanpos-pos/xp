import { z } from "zod";

export const SignUpSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters long."),
  slug: z
    .string()
    .min(3, "Store URL ID must be at least 3 characters long.")
    .regex(/^[a-z0-9-]+$/, "Store URL can only contain lowercase letters, numbers, and hyphens."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
