
// File: src/app/(app)/orders/payment-actions.ts
"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function recordPaymentAction(
  orderId: string, 
  amount: number, 
  method: string, 
  notes?: string
) {
  try {
    // 1. Record the transaction in the payments table
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      amount: amount,
      payment_method: method,
      notes: notes,
    });

    if (paymentError) throw paymentError;

    // 2. Get the current order details to calculate totals
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, amount_paid")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    // 3. Calculate new status
    const currentPaid = order.amount_paid || 0;
    const newPaidTotal = currentPaid + amount;
    const totalDue = order.total_amount;

    let newStatus = "Unpaid";
    if (newPaidTotal >= totalDue) {
      newStatus = "Paid";
    } else if (newPaidTotal > 0) {
      newStatus = "Partially Paid"; // You might need to add this status to your DB check constraint if it's restricted
    }

    // 4. Update the order with new amount_paid and status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        amount_paid: newPaidTotal,
        payment_status: newStatus,
        status: newStatus === 'Paid' ? 'Ready for Pickup' : undefined // Optional: Auto-advance workflow?
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true, message: "Payment recorded successfully" };
  } catch (error: any) {
    console.error("Payment error:", error);
    return { success: false, message: error.message || "Failed to record payment" };
  }
}
