
// supabase/functions/create-order-transactional/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'; // Updated Deno std version
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'; // Pinned supabase-js version
import { corsHeaders } from '../_shared/cors.ts';

interface OrderItemInputForFunction {
  serviceItemId: string;
  serviceName: string;
  originalUnitPrice?: number;
  unitPrice: number;
  quantity: number;
  itemDiscountAmount?: number;
  itemDiscountPercentage?: number;
  notes?: string;
  has_color_identifier?: boolean;
  color_value?: string;
}

interface CreateOrderInputForFunction {
  customerId: string;
  items: OrderItemInputForFunction[];
  dueDate?: string; // ISO string
  notes?: string;
  isExpress?: boolean;
  cartDiscountAmount?: number;
  cartDiscountPercentage?: number;
  cartPriceOverride?: number;
}

interface DbOrderHeader {
    id: string;
    order_number: string;
    customer_id: string;
    customer_name: string;
    subtotal_amount: number;
    cart_discount_amount: number | null;
    cart_discount_percentage: number | null;
    cart_price_override: number | null;
    total_amount: number;
    status: string;
    payment_status: string;
    notes: string | null;
    is_express: boolean;
    due_date: string | null;
    created_at: string;
    updated_at: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const orderInput: CreateOrderInputForFunction = await req.json();

    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // USE SERVICE ROLE KEY HERE
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } } // Auth with service role for internal calls
    );

    // 1. Fetch customer details (especially name)
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('name')
      .eq('id', orderInput.customerId)
      .single();

    if (customerError || !customer) {
      console.error('Edge Function: Customer fetch error or not found', customerError);
      return new Response(JSON.stringify({ error: 'Customer not found or error fetching customer.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const customerName = customer.name;

    // 2. Prepare items for the pg function, calculating total_price for each item
    const p_items_for_db_func = orderInput.items.map(item => {
        let itemEffectiveTotal = item.unitPrice * item.quantity;
        if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) {
            itemEffectiveTotal -= itemEffectiveTotal * (item.itemDiscountPercentage / 100);
        }
        if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
            itemEffectiveTotal -= item.itemDiscountAmount;
        }
        itemEffectiveTotal = Math.max(0, itemEffectiveTotal);
        return {
            service_item_id: item.serviceItemId,
            service_name: item.serviceName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            original_unit_price: item.originalUnitPrice,
            item_discount_amount: item.itemDiscountAmount,
            item_discount_percentage: item.itemDiscountPercentage,
            total_price: itemEffectiveTotal,
            notes: item.notes,
            has_color_identifier: item.has_color_identifier,
            color_value: item.color_value,
        };
    });

    // 3. Calculate overall order totals (subtotal, grandTotal)
    let subtotal = 0;
    p_items_for_db_func.forEach(item => {
        subtotal += item.total_price;
    });

    let totalAfterCartDiscounts = subtotal;
    if (orderInput.cartDiscountPercentage && orderInput.cartDiscountPercentage > 0) {
        totalAfterCartDiscounts -= totalAfterCartDiscounts * (orderInput.cartDiscountPercentage / 100);
    }
    if (orderInput.cartDiscountAmount && orderInput.cartDiscountAmount > 0) {
        totalAfterCartDiscounts -= orderInput.cartDiscountAmount;
    }
    totalAfterCartDiscounts = Math.max(0, totalAfterCartDiscounts);

    const grandTotal = (orderInput.cartPriceOverride !== undefined && orderInput.cartPriceOverride >= 0)
        ? orderInput.cartPriceOverride
        : totalAfterCartDiscounts;

    // 4. Call the PostgreSQL function
    const rpcParams = {
        p_customer_id: orderInput.customerId,
        p_customer_name: customerName,
        p_subtotal_amount: subtotal,
        p_cart_discount_amount: orderInput.cartDiscountAmount,
        p_cart_discount_percentage: orderInput.cartDiscountPercentage,
        p_cart_price_override: orderInput.cartPriceOverride,
        p_total_amount: grandTotal,
        p_status: 'Received',
        p_payment_status: 'Unpaid',
        p_notes: orderInput.notes,
        p_is_express: orderInput.isExpress || false,
        p_due_date: orderInput.dueDate ? new Date(orderInput.dueDate).toISOString() : null,
        p_items: p_items_for_db_func,
    };
    
    const { data: rpcResult, error: rpcError } = await supabaseClient.rpc(
      'create_order_with_items_tx',
      rpcParams
    );

    if (rpcError) {
      console.error('Edge Function: RPC error calling create_order_with_items_tx. Params:', JSON.stringify(rpcParams, null, 2), 'Error:', JSON.stringify(rpcError, null, 2));
      let detailedMessage = rpcError.message;
      if (rpcError.details && typeof rpcError.details === 'string' && rpcError.details.length > 0) {
          detailedMessage = rpcError.details;
      } else if (rpcError.message && rpcError.message.includes("transaction_rolled_back")) {
        detailedMessage = "Order creation failed and was rolled back due to an internal error. Check database function logs for SQLSTATE and SQLERRM."
      }
      return new Response(JSON.stringify({ error: 'Failed to create order transactionally.', details: detailedMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    const createdOrderHeader = rpcResult && Array.isArray(rpcResult) && rpcResult.length > 0 ? rpcResult[0] as DbOrderHeader : null;

    if (!createdOrderHeader || !createdOrderHeader.id) {
        console.error('Edge Function: RPC create_order_with_items_tx did not return expected order data or ID. Result:', JSON.stringify(rpcResult, null, 2));
        return new Response(JSON.stringify({ error: 'Order created but failed to retrieve details from database function.'}), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 500
        });
    }
    
    const { data: fullOrder, error: fetchFullOrderError } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', createdOrderHeader.id)
        .single();

    if (fetchFullOrderError || !fullOrder) {
        console.error('Edge Function: Failed to fetch full order after creation. Error:', fetchFullOrderError, 'Order Header from DB func:', createdOrderHeader);
        return new Response(JSON.stringify({ ...createdOrderHeader, items: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201, 
        });
    }

    return new Response(JSON.stringify(fullOrder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    console.error('Edge Function: Unhandled error in serve function', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

