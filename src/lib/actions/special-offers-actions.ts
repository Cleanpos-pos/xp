
"use server";

import { supabase } from "@/lib/supabase";
import type { SpecialOffer, SpecialOfferTypeIdentifier } from "@/types";
import { revalidatePath } from "next/cache";

interface SpecialOfferActionResult {
  success: boolean;
  message?: string;
  offer?: SpecialOffer;
  offers?: SpecialOffer[];
  error?: any;
}

// Define the fixed ID for the single settings row if we were using one, but here we use offer_type_identifier for upsert
const SPECIAL_OFFERS_TABLE = "special_offers";

export async function getSpecialOffersAction(): Promise<SpecialOffer[]> {
  try {
    const { data, error } = await supabase
      .from(SPECIAL_OFFERS_TABLE)
      .select("*");

    if (error) {
      console.error("Error fetching special offers:", error);
      throw error;
    }
    return (data || []).map(dbOffer => ({
        ...dbOffer,
        valid_from: dbOffer.valid_from ? new Date(dbOffer.valid_from).toISOString() : null,
        valid_to: dbOffer.valid_to ? new Date(dbOffer.valid_to).toISOString() : null,
        // Ensure numeric fields are parsed correctly if they might be strings from DB (though Supabase client usually handles this)
        buy_x_items: dbOffer.buy_x_items !== null ? Number(dbOffer.buy_x_items) : null,
        pay_for_y_items: dbOffer.pay_for_y_items !== null ? Number(dbOffer.pay_for_y_items) : null,
        bundle_item_count: dbOffer.bundle_item_count !== null ? Number(dbOffer.bundle_item_count) : null,
        bundle_price: dbOffer.bundle_price !== null ? Number(dbOffer.bundle_price) : null,
        spend_threshold: dbOffer.spend_threshold !== null ? Number(dbOffer.spend_threshold) : null,
    })) as SpecialOffer[];
  } catch (error) {
    console.error("Catch block: Error fetching special offers:", error);
    return [];
  }
}

export async function upsertSpecialOfferAction(
  offerData: Omit<SpecialOffer, 'id' | 'created_at' | 'updated_at'> & { offer_type_identifier: SpecialOfferTypeIdentifier }
): Promise<SpecialOfferActionResult> {
  try {
    const dataToUpsert = {
      ...offerData,
      valid_from: offerData.valid_from ? new Date(offerData.valid_from).toISOString() : null,
      valid_to: offerData.valid_to ? new Date(offerData.valid_to).toISOString() : null,
      buy_x_items: offerData.buy_x_items ? Number(offerData.buy_x_items) : null,
      pay_for_y_items: offerData.pay_for_y_items ? Number(offerData.pay_for_y_items) : null,
      bundle_item_count: offerData.bundle_item_count ? Number(offerData.bundle_item_count) : null,
      bundle_price: offerData.bundle_price ? Number(offerData.bundle_price) : null,
      spend_threshold: offerData.spend_threshold ? Number(offerData.spend_threshold) : null,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields that might cause issues with Supabase client if they are not nullable in DB
    // or if default values should apply. For upsert, usually better to send nulls if column is nullable.
    Object.keys(dataToUpsert).forEach(key => {
        if (dataToUpsert[key as keyof typeof dataToUpsert] === undefined) {
            dataToUpsert[key as keyof typeof dataToUpsert] = null;
        }
    });


    const { data, error } = await supabase
      .from(SPECIAL_OFFERS_TABLE)
      .upsert(dataToUpsert, { onConflict: 'offer_type_identifier' })
      .select()
      .single();

    if (error) {
      console.error("Error upserting special offer:", error);
      return {
        success: false,
        message: "Failed to save special offer. " + error.message,
        error,
      };
    }

    revalidatePath("/settings"); 

    return {
      success: true,
      message: `Special offer '${offerData.offer_type_identifier}' saved successfully.`,
      offer: data ? ({
        ...data,
        valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : null,
        valid_to: data.valid_to ? new Date(data.valid_to).toISOString() : null,
      } as SpecialOffer) : undefined,
    };
  } catch (error: any) {
    console.error("Catch block: Error upserting special offer:", error);
    return {
      success: false,
      message: "An unexpected error occurred: " + error.message,
      error,
    };
  }
}

// Delete action might be useful later if you allow deleting offers
export async function deleteSpecialOfferAction(offerTypeIdentifier: SpecialOfferTypeIdentifier): Promise<SpecialOfferActionResult> {
    try {
        const { error, count } = await supabase
            .from(SPECIAL_OFFERS_TABLE)
            .delete()
            .eq('offer_type_identifier', offerTypeIdentifier);

        if (error) {
            throw error;
        }

        if (count === 0) {
            return { success: false, message: `Offer type ${offerTypeIdentifier} not found.` };
        }

        revalidatePath("/settings");
        return { success: true, message: `Offer type ${offerTypeIdentifier} deleted successfully.` };
    } catch (error: any) {
        console.error(`Error deleting offer ${offerTypeIdentifier}:`, error);
        return { success: false, message: error.message || "Failed to delete offer." };
    }
}
