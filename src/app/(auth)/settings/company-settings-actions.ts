
"use server";

import { supabase } from "@/lib/supabase";
import type { CompanySettings } from "@/types";
import { revalidatePath } from "next/cache";

interface CompanySettingsActionResult {
  success: boolean;
  message?: string;
  settings?: CompanySettings;
  error?: any;
}

// Define the fixed ID for the single settings row
const SETTINGS_ROW_ID = 'global_settings';

export async function getCompanySettingsAction(): Promise<CompanySettings | null> {
  try {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching company settings:", error);
      throw error;
    }
    if (data) {
        // Ensure numeric fields are parsed correctly and JSON fields are handled
        return {
            ...data,
            vat_sales_tax_rate: data.vat_sales_tax_rate !== null ? parseFloat(data.vat_sales_tax_rate) : undefined,
            available_collection_schedule: data.available_collection_schedule || {},
            available_delivery_schedule: data.available_delivery_schedule || {},
            stripe_connect_account_id: data.stripe_connect_account_id || null,
            enable_platform_fee_pass_through: data.enable_platform_fee_pass_through ?? false,
            delivery_fee_base_gbp: data.delivery_fee_base_gbp !== null ? parseFloat(data.delivery_fee_base_gbp) : undefined,
            delivery_fee_per_mile_gbp: data.delivery_fee_per_mile_gbp !== null ? parseFloat(data.delivery_fee_per_mile_gbp) : undefined,
            delivery_fee_minimum_gbp: data.delivery_fee_minimum_gbp !== null ? parseFloat(data.delivery_fee_minimum_gbp) : undefined,
        } as CompanySettings;
    }
    return null;
  } catch (error) {
    console.error("Catch block: Error fetching company settings:", error);
    return null;
  }
}

export async function updateCompanySettingsAction(
  settingsData: Omit<CompanySettings, 'created_at' | 'updated_at'>
): Promise<CompanySettingsActionResult> {
  try {
    // Prepare data for upsert, ensuring the fixed ID and updated_at timestamp
    const dataToUpsert = {
      ...settingsData,
      id: SETTINGS_ROW_ID, // Ensure the ID is always our fixed ID for upsert
      vat_sales_tax_rate: settingsData.vat_sales_tax_rate !== undefined ? Number(settingsData.vat_sales_tax_rate) : null,
      available_collection_schedule: settingsData.available_collection_schedule || {},
      available_delivery_schedule: settingsData.available_delivery_schedule || {},
      stripe_connect_account_id: settingsData.stripe_connect_account_id || null,
      enable_platform_fee_pass_through: settingsData.enable_platform_fee_pass_through ?? false,
      delivery_fee_base_gbp: settingsData.delivery_fee_base_gbp !== undefined ? Number(settingsData.delivery_fee_base_gbp) : null,
      delivery_fee_per_mile_gbp: settingsData.delivery_fee_per_mile_gbp !== undefined ? Number(settingsData.delivery_fee_per_mile_gbp) : null,
      delivery_fee_minimum_gbp: settingsData.delivery_fee_minimum_gbp !== undefined ? Number(settingsData.delivery_fee_minimum_gbp) : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("company_settings")
      .upsert(dataToUpsert, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Error updating company settings:", error);
      return {
        success: false,
        message: "Failed to update company settings. " + error.message,
        error,
      };
    }

    revalidatePath("/settings"); // Revalidate settings page to show updated data

    return {
      success: true,
      message: "Company settings updated successfully.",
      settings: data ? ({
        ...data,
        vat_sales_tax_rate: data.vat_sales_tax_rate !== null ? parseFloat(data.vat_sales_tax_rate) : undefined,
        available_collection_schedule: data.available_collection_schedule || {},
        available_delivery_schedule: data.available_delivery_schedule || {},
        stripe_connect_account_id: data.stripe_connect_account_id || null,
        enable_platform_fee_pass_through: data.enable_platform_fee_pass_through ?? false,
        delivery_fee_base_gbp: data.delivery_fee_base_gbp !== null ? parseFloat(data.delivery_fee_base_gbp) : undefined,
        delivery_fee_per_mile_gbp: data.delivery_fee_per_mile_gbp !== null ? parseFloat(data.delivery_fee_per_mile_gbp) : undefined,
        delivery_fee_minimum_gbp: data.delivery_fee_minimum_gbp !== null ? parseFloat(data.delivery_fee_minimum_gbp) : undefined,
      } as CompanySettings) : undefined,
    };
  } catch (error: any) {
    console.error("Catch block: Error updating company settings:", error);
    return {
      success: false,
      message: "An unexpected error occurred: " + error.message,
      error,
    };
  }
}
