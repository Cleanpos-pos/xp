
"use server";

import { supabase } from "@/lib/supabase";
import type { PrinterSettings } from "@/types";
import { revalidatePath } from "next/cache";

interface PrinterSettingsActionResult {
  success: boolean;
  message?: string;
  settings?: PrinterSettings;
  error?: any;
}

// Define the fixed ID for the single settings row
const PRINTER_SETTINGS_ROW_ID = 'global_printer_settings';

export async function getPrinterSettingsAction(): Promise<PrinterSettings | null> {
  try {
    const { data, error } = await supabase
      .from("printer_settings")
      .select("*")
      .eq("id", PRINTER_SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error("Error fetching printer settings:", error);
      // Don't throw, allow defaults to be used on client if table doesn't exist yet
      return null;
    }
    return data ? (data as PrinterSettings) : null;
  } catch (error) {
    console.error("Catch block: Error fetching printer settings:", error);
    return null;
  }
}

export async function updatePrinterSettingsAction(
  settingsData: Omit<PrinterSettings, 'created_at' | 'updated_at'>
): Promise<PrinterSettingsActionResult> {
  try {
    const dataToUpsert = {
      ...settingsData,
      id: PRINTER_SETTINGS_ROW_ID, // Ensure the ID is always our fixed ID for upsert
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("printer_settings")
      .upsert(dataToUpsert, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Error updating printer settings:", error);
      return {
        success: false,
        message: "Failed to update printer settings. " + error.message,
        error,
      };
    }

    revalidatePath("/settings"); 

    return {
      success: true,
      message: "Printer settings updated successfully.",
      settings: data ? (data as PrinterSettings) : undefined,
    };
  } catch (error: any) {
    console.error("Catch block: Error updating printer settings:", error);
    return {
      success: false,
      message: "An unexpected error occurred: " + error.message,
      error,
    };
  }
}
