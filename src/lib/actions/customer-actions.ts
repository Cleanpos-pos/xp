
"use server";

import { updateCustomerAccountDetailsDb, updateFullCustomerDb } from "@/lib/data";
import { UpdateCustomerAccountDetailsSchema, type UpdateCustomerAccountDetailsInput } from "./settings.schema";
import { CreateCustomerSchema, type CreateCustomerInput } from "@/app/customers/new/customer.schema";
import type { Customer } from "@/types";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

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
      message: "Invalid data provided for account details.",
      errors: validationResult.error.issues,
    };
  }

  const { customerId, is_account_client, account_id } = validationResult.data;

  try {
    const updatedCustomer = await updateCustomerAccountDetailsDb(customerId, {
      is_account_client,
      account_id: account_id === "" ? null : account_id, 
    });
    
    revalidatePath("/settings"); 
    revalidatePath("/customers"); 
    revalidatePath(`/customers/${customerId}`); 

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
