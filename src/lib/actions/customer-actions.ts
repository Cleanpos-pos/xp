
"use server";

import { type CreateCustomerInput, CreateCustomerSchema } from "@/lib/schemas/customer.schema";
import { createCustomer as createCustomerInDb, updateFullCustomerDb } from "@/lib/data";
import { revalidatePath } from "next/cache";
import type { Customer } from "@/types";
import type { z } from "zod";


interface ActionResult {
  success: boolean;
  message?: string;
  customer?: Customer;
  errors?: z.ZodIssue[] | null;
}


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
    revalidatePath('/settings');

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

export async function updateCustomerAction(
  customerId: string,
  data: CreateCustomerInput
): Promise<ActionResult> {
  const validationResult = CreateCustomerSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid customer data provided.",
      errors: validationResult.error.issues,
    };
  }

  try {
    const updatedCustomer = await updateFullCustomerDb(customerId, validationResult.data);
    
    revalidatePath("/settings");
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return {
      success: true,
      message: `Customer ${updatedCustomer.name}'s details updated successfully.`,
      customer: updatedCustomer,
    };
  } catch (error: any) {
    console.error("Error in updateCustomerAction:", error);
    return {
      success: false,
      message: error.message || "Failed to update customer details.",
      errors: null,
    };
  }
}
