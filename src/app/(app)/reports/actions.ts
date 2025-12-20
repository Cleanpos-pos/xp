// File: src/app/(app)/reports/actions.ts
"use server";

import { supabase } from "@/lib/supabase";

export interface AiInsightData {
  id: string;
  created_at: string;
  summary_text: string | null;
  trending_services: string[];
  revenue_forecast: number | null;
  revenue_change_percentage: number | null;
  actionable_tips: string[];
}

export async function getLatestAiInsight(): Promise<AiInsightData | null> {
  try {
    // Fetch the most recent insight entry
    const { data, error } = await supabase
      .from("ai_report_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching AI insights:", error);
      return null;
    }

    return {
      ...data,
      // Ensure JSONB columns are returned as proper arrays
      trending_services: Array.isArray(data.trending_services) ? data.trending_services : [],
      actionable_tips: Array.isArray(data.actionable_tips) ? data.actionable_tips : [],
    };
  } catch (error) {
    console.error("Unexpected error in getLatestAiInsight:", error);
    return null;
  }
}
