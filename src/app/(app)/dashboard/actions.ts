
"use server";

import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  revenue_today: number;
  orders_count_today: number;
  active_customers: number;
  items_processed_today: number;
  takings_cash: number;
  takings_card: number;
  recent_orders: {
    order_number: string;
    customer_name: string;
    status: string;
    total_amount: number;
  }[];
}

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }

    // Ensure defaults if data is missing
    return {
      revenue_today: Number(data.revenue_today || 0),
      orders_count_today: Number(data.orders_count_today || 0),
      active_customers: Number(data.active_customers || 0),
      items_processed_today: Number(data.items_processed_today || 0),
      takings_cash: Number(data.takings_cash || 0),
      takings_card: Number(data.takings_card || 0),
      recent_orders: Array.isArray(data.recent_orders) ? data.recent_orders : []
    };
  } catch (error) {
    console.error("Dashboard Server Action failed:", error);
    // Return zeroed data so the UI doesn't crash
    return {
      revenue_today: 0, orders_count_today: 0, active_customers: 0, items_processed_today: 0,
      takings_cash: 0, takings_card: 0, recent_orders: []
    };
  }
}
