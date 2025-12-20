
"use server";

import { supabase } from "@/lib/supabase";
import type { Order } from "@/types";
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export async function getSalesOverview(startDate: Date, endDate: Date): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total_amount')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in('status', ['Received', 'Processing', 'Cleaning', 'Alterations', 'Ready for Pickup', 'Completed']); // Exclude cancelled

  if (error) {
    console.error("Error fetching sales overview data:", error);
    throw error;
  }

  // Group by day
  const dailyData = (data || []).reduce((acc, order) => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { sales: 0, orders: 0 };
    }
    acc[date].sales += order.total_amount;
    acc[date].orders += 1;
    return acc;
  }, {} as Record<string, { sales: number; orders: number }>);
  
  // Fill in missing days
  const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
  const chartData = intervalDays.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dataForDay = dailyData[dateKey] || { sales: 0, orders: 0 };
    return {
      date: format(day, 'MMM d'), // e.g. "Jan 23"
      sales: dataForDay.sales,
      orders: dataForDay.orders,
    };
  });

  return chartData;
}

export async function getServicePopularity(startDate: Date, endDate: Date): Promise<any[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('service_name, quantity')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error("Error fetching service popularity data:", error);
    throw error;
  }
  
  const serviceCounts = (data || []).reduce((acc, item) => {
    acc[item.service_name] = (acc[item.service_name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(serviceCounts)
    .map(([serviceName, count]) => ({ serviceName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Return top 5
}

export async function getCategorySales(startDate: Date, endDate: Date): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_sales_by_category', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  });

  if (error) {
      console.error('Error fetching category sales:', error);
      throw error;
  }

  return (data || []).map((item: any) => ({
      category: item.category_name,
      sales: item.total_sales
  }));
}

export async function getOrdersForReport(startDate: Date, endDate: Date): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 for performance

    if (error) {
        console.error("Error fetching orders for report:", error);
        throw error;
    }

    return (data || []).map(o => ({
        ...o,
        totalAmount: o.total_amount,
        customerName: o.customer_name,
        orderNumber: o.order_number,
        items: [], // Items not needed for this summary view
    })) as Order[];
}
