
import { z } from "zod";

export const CreateServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
