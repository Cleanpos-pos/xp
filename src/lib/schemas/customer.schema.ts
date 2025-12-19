
import { z } from "zod";

const LoyaltyStatusEnum = z.enum(["None", "Bronze", "Silver", "Gold"]).optional();
const PriceBandEnum = z.enum(["Standard", "Band A", "Band B", "Band C"]).optional();

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().refine(val => !val || /^[0-9\s-()+]+$/.test(val), {
    message: "Invalid phone number format",
  }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')), // Allow empty string or valid email
  address: z.string().optional(),
  loyaltyStatus: LoyaltyStatusEnum,
  priceBand: PriceBandEnum,
  smsOptIn: z.boolean().optional().default(false),
  emailOptIn: z.boolean().optional().default(false),
  hasPreferredPricing: z.boolean().optional().default(false),
  isAccountClient: z.boolean().optional().default(false),
  accountId: z.string().optional(), // Added for account ID
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
