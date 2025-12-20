// File: src/app/(app)/reports/actions.ts
"use server";

import { supabase } from "@/lib/supabase";

// --- Types ---

export interface AiInsightData {
  id: string;
  created_at: string;
  summary_text: string | null;
  trending_services: string[];
  revenue_forecast: number | null;
  revenue_change_percentage: number | null;
  actionable_tips: string[];
}

export interface ReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    ordersAttention: number;
  };
  salesTrend: { month: string; sales: number; orders: number }[];
  categorySales: { category: string; sales: number; fill: string }[];
  topServices: { name: string; value: number; fill: string }[];
  recentOrders: any[];
}

// --- AI Insights Function ---

export async function getLatestAiInsight(): Promise<AiInsightData | null> {
  try {
    const { data, error } = await supabase
      .from("ai_report_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // It's normal to have no insights yet, so we just return null rather than crashing
      if (error.code === 'PGRST116') return null; 
      console.error("Error fetching AI insights:", error);
      return null;
    }

    return {
      ...data,
      trending_services: Array.isArray(data.trending_services) ? data.trending_services : [],
      actionable_tips: Array.isArray(data.actionable_tips) ? data.actionable_tips : [],
    };
  } catch (error) {
    console.error("Unexpected error in getLatestAiInsight:", error);
    return null;
  }
}

// --- Main Report Data Function ---

export async function fetchReportDataAction(from: Date, to: Date): Promise<ReportData> {
  const startDate = from.toISOString();
  const endDate = to.toISOString();

  try {
    // 1. Fetch Summary KPIs
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_report_summary', { start_date: startDate, end_date: endDate })
      .single();

    if (summaryError) throw summaryError;

    // 2. Fetch Sales Trend
    const { data: trendData, error: trendError } = await supabase
      .rpc('get_sales_trends', { start_date: startDate, end_date: endDate });

    if (trendError) throw trendError;

    // 3. Fetch Category Sales
    const { data: catData, error: catError } = await supabase
      .rpc('get_sales_by_category', { start_date: startDate, end_date: endDate });

    if (catError) throw catError;

    // 4. Fetch Top Services
    const { data: serviceData, error: serviceError } = await supabase
      .rpc('get_top_services', { start_date: startDate, end_date: endDate });

    if (serviceError) throw serviceError;

    // 5. Fetch Recent Orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) throw ordersError;

    // --- Format Data ---
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

    return {
      summary: {
        totalRevenue: Number(summaryData?.total_revenue || 0),
        totalOrders: Number(summaryData?.total_orders || 0),
        avgOrderValue: Number(summaryData?.avg_order_value || 0),
        ordersAttention: Number(summaryData?.orders_attention || 0),
      },
      salesTrend: trendData?.map((item: any) => ({
        month: item.period_label,
        sales: Number(item.total_sales),
        orders: Number(item.order_count)
      })) || [],
      categorySales: catData?.map((item: any, index: number) => ({
        category: item.category_name,
        sales: Number(item.total_sales),
        fill: colors[index % colors.length]
      })) || [],
      topServices: serviceData?.map((item: any, index: number) => ({
        name: item.service_name,
        value: Number(item.usage_count),
        fill: colors[index % colors.length]
      })) || [],
      recentOrders: ordersData || []
    };

  } catch (error: any) {
    console.error("Error fetching report data:", error);
    throw new Error(error.message || "Failed to fetch reports");
  }
}
