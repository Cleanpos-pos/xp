
"use server";

import { type CreateCustomerInput, CreateCustomerSchema } from "@/app/(app)/customers/new/customer.schema";
import { createCustomer as createCustomerInDb } from "@/lib/data";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(data: CreateCustomerInput) {
  const validationResult = CreateCustomerSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    // Map form data (camelCase) to database columns (snake_case)
    const customerToInsert = {
      name: validationResult.data.name,
      phone: validationResult.data.phone || null,
      email: validationResult.data.email || null,
      address: validationResult.data.address || null,
      loyalty_status: validationResult.data.loyaltyStatus || 'None',
      price_band: validationResult.data.priceBand || 'Standard',
      sms_opt_in: validationResult.data.smsOptIn || false,
      email_opt_in: validationResult.data.emailOptIn || false,
      has_preferred_pricing: validationResult.data.hasPreferredPricing || false,
      is_account_client: validationResult.data.isAccountClient || false,
      account_id: validationResult.data.accountId || null,
    };

    const newCustomer = await createCustomerInDb(customerToInsert);
    
    revalidatePath('/customers');

    return {
      success: true,
      message: `Customer ${newCustomer.name} created successfully!`,
      customerId: newCustomer.id, 
    };
  } catch (error: any) {
    console.error("Error creating customer in action:", error);
    return {
      success: false,
      message: error.message || "Failed to create customer.",
    };
  }
}
