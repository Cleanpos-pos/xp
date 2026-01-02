
"use server";

import { supabase } from "@/lib/supabase";
import type { SpecialOffer, SpecialOfferTypeIdentifier } from "@/types";
import { revalidatePath } from "next/cache";

const SPECIAL_OFFERS_TABLE = "special_offers";

export async function getSpecialOffersAction(): Promise<SpecialOffer[]> {
  try {
    const { data, error } = await supabase.from(SPECIAL_OFFERS_TABLE).select("*");
    if (error) throw error;
    
    return (data || []).map(dbOffer => ({
        ...dbOffer,
        valid_from: dbOffer.valid_from ? new Date(dbOffer.valid_from).toISOString() : null,
        valid_to: dbOffer.valid_to ? new Date(dbOffer.valid_to).toISOString() : null,
        buy_x_items: dbOffer.buy_x_items ? Number(dbOffer.buy_x_items) : null,
        pay_for_y_items: dbOffer.pay_for_y_items ? Number(dbOffer.pay_for_y_items) : null,
        bundle_item_count: dbOffer.bundle_item_count ? Number(dbOffer.bundle_item_count) : null,
        bundle_price: dbOffer.bundle_price ? Number(dbOffer.bundle_price) : null,
        spend_threshold: dbOffer.spend_threshold ? Number(dbOffer.spend_threshold) : null,
        
        // Ensure these are arrays
        eligible_items: Array.isArray(dbOffer.eligible_items) ? dbOffer.eligible_items : [],
        eligible_categories: Array.isArray(dbOffer.eligible_categories) ? dbOffer.eligible_categories : [],
    })) as SpecialOffer[];
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return [];
  }
}

export async function upsertSpecialOfferAction(
  offerData: SpecialOffer
): Promise<{ success: boolean; message?: string }> {
  try {
    // Create a copy of the data to modify
    const { tenant_id, ...dataToUpsert } = {
      // Basic fields
      offer_type_identifier: offerData.offer_type_identifier,
      is_active: offerData.is_active,
      notes: offerData.notes,
      valid_from: offerData.valid_from,
      valid_to: offerData.valid_to,
      
      // Offer specific logic
      buy_x_items: offerData.buy_x_items,
      pay_for_y_items: offerData.pay_for_y_items,
      bundle_item_count: offerData.bundle_item_count,
      bundle_price: offerData.bundle_price,
      spend_threshold: offerData.spend_threshold,
      free_item_description: offerData.free_item_description,

      // Assignments
      eligible_items: offerData.eligible_items || [],
      eligible_categories: offerData.eligible_categories || [],

      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(SPECIAL_OFFERS_TABLE)
      .upsert(dataToUpsert, { onConflict: 'offer_type_identifier' });

    if (error) throw error;

    revalidatePath("/settings");
    revalidatePath("/orders/new"); // Ensure POS gets latest offers

    return { success: true, message: "Offer saved successfully." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
