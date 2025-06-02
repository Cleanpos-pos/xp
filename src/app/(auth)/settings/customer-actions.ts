
"use server";

import { updateCustomerAccountDetailsDb } from "@/lib/data";
import { UpdateCustomerAccountDetailsSchema, type UpdateCustomerAccountDetailsInput } from "./settings.schema";
import type { Customer } from "@/types";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  message?: string;
  customer?: Customer;
  errors?: z.ZodIssue[] | null;
}

export async function updateCustomerAccountDetailsAction(
  data: UpdateCustomerAccountDetailsInput
): Promise<ActionResult> {
  const validationResult = UpdateCustomerAccountDetailsSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validationResult.error.issues,
    };
  }

  const { customerId, is_account_client, account_id } = validationResult.data;

  try {
    const updatedCustomer = await updateCustomerAccountDetailsDb(customerId, {
      is_account_client,
      account_id: account_id === "" ? null : account_id, // Ensure empty string becomes null
    });
    
    revalidatePath("/settings"); // Revalidate the settings page to show updated data
    revalidatePath("/customers"); // Also revalidate customers list page if it uses this data
    revalidatePath(`/customers/${customerId}`); // And specific customer details if applicable

    return {
      success: true,
      message: `Customer ${updatedCustomer.name}'s account details updated.`,
      customer: updatedCustomer,
    };
  } catch (error: any) {
    console.error("Error in updateCustomerAccountDetailsAction:", error);
    return {
      success: false,
      message: error.message || "Failed to update customer account details.",
      errors: null,
    };
  }
}
