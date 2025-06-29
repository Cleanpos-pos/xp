
// supabase/functions/create-order-transactional/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'; // Using a specific version

// Inlined CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development. In production, specify your frontend domain.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specify allowed methods
};

console.log("[create-order-transactional] Full function module loading...");

// Define input type based on CreateOrderInput from the main app
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

// Type for the data returned by the pg_function (order header)
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
    due_date: string | null; // TIMESTAMPTZ
    created_at: string; // TIMESTAMPTZ
    updated_at: string; // TIMESTAMPTZ
}


serve(async (req: Request) => {
  console.log(`[create-order-transactional] Request received: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log("[create-order-transactional] Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const orderInput: CreateOrderInputForFunction = await req.json();
    console.log("[create-order-transactional] Parsed order input:", JSON.stringify(orderInput, null, 2).substring(0, 500) + "..."); // Log first 500 chars

    const supabaseURL = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseURL || !supabaseServiceRoleKey) {
      console.error("[create-order-transactional] CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in function secrets!");
      return new Response(JSON.stringify({ error: "Function configuration error: Essential secrets missing." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("[create-order-transactional] Secrets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY seem to be present.");

    // Initialize Supabase client with service_role key for elevated privileges
    const supabaseAdminClient: SupabaseClient = createClient(
      supabaseURL,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } } // No need to persist session for service_role
    );
    console.log("[create-order-transactional] Supabase admin client initialized.");

    // 1. Fetch customer details (especially name)
    console.log(`[create-order-transactional] Fetching customer by ID: ${orderInput.customerId}`);
    const { data: customer, error: customerError } = await supabaseAdminClient
      .from('customers')
      .select('name')
      .eq('id', orderInput.customerId)
      .single();

    if (customerError || !customer) {
      console.error('[create-order-transactional] Customer fetch error or not found:', customerError);
      return new Response(JSON.stringify({ error: 'Customer not found or error fetching customer.', details: customerError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const customerName = customer.name;
    console.log(`[create-order-transactional] Customer found: ${customerName}`);

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
    console.log("[create-order-transactional] Items prepared for DB function:", JSON.stringify(p_items_for_db_func, null, 2).substring(0, 500) + "...");

    // 3. Calculate overall order totals
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

    const grandTotal = (orderInput.cartPriceOverride !== undefined && orderInput.cartPriceOverride !== null && orderInput.cartPriceOverride >= 0)
        ? orderInput.cartPriceOverride
        : totalAfterCartDiscounts;
    console.log(`[create-order-transactional] Calculated totals: subtotal=${subtotal}, grandTotal=${grandTotal}`);

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
    console.log("[create-order-transactional] Calling RPC 'create_order_with_items_tx' with params (first 500 chars):", JSON.stringify(rpcParams, null, 2).substring(0, 500) + "...");
    
    const { data: rpcResult, error: rpcError } = await supabaseAdminClient.rpc(
      'create_order_with_items_tx',
      rpcParams
    );

    if (rpcError) {
      console.error('[create-order-transactional] RPC error:', JSON.stringify(rpcError, null, 2));
      let detailedMessage = rpcError.message;
      if (rpcError.details && typeof rpcError.details === 'string' && rpcError.details.length > 0) {
          detailedMessage = rpcError.details;
      } else if (rpcError.message && (rpcError.message.includes("transaction_rolled_back") || rpcError.message.includes("does not exist") || rpcError.message.includes("violates foreign key constraint"))) {
        detailedMessage = "Order creation failed due to a database error. Please check function logs for SQLSTATE and SQLERRM. Possible cause: incorrect data types, missing related records (e.g., customer, service items), or issues with the 'create_order_with_items_tx' PostgreSQL function itself.";
        if (rpcError.hint) detailedMessage += ` Hint: ${rpcError.hint}`;
      }
      return new Response(JSON.stringify({ error: 'Failed to create order transactionally.', details: detailedMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("[create-order-transactional] RPC call successful. Result (first 500 chars):", JSON.stringify(rpcResult, null, 2).substring(0, 500) + "...");
    
    const createdOrderHeader = rpcResult && Array.isArray(rpcResult) && rpcResult.length > 0 ? rpcResult[0] as DbOrderHeader : null;

    if (!createdOrderHeader || !createdOrderHeader.id) {
        console.error('[create-order-transactional] RPC did not return expected order data or ID. Result:', JSON.stringify(rpcResult, null, 2));
        return new Response(JSON.stringify({ error: 'Order created but failed to retrieve details from database function.'}), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 500
        });
    }
    console.log(`[create-order-transactional] Order header created with ID: ${createdOrderHeader.id}`);

    // ----- [NEW] LOGIC TO GENERATE AND UPDATE ORDER NUMBER -----
    const now = new Date();
    // In Deno, constructing a date with just year and month defaults to the first day at UTC.
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count, error: countError } = await supabaseAdminClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());
    
    if (countError) {
      console.error('[create-order-transactional] Error counting orders for the month:', countError);
    } else if (count !== null) {
      const monthPrefix = String(now.getMonth() + 1).padStart(2, '0');
      // The count of orders in the month *is* the sequence number for the newly created order.
      const sequence = String(count).padStart(4, '0');
      const newOrderNumber = `${monthPrefix}-${sequence}`;

      console.log(`[create-order-transactional] Updating order number for ID ${createdOrderHeader.id} to ${newOrderNumber}`);

      const { error: updateError } = await supabaseAdminClient
        .from('orders')
        .update({ order_number: newOrderNumber, updated_at: new Date().toISOString() })
        .eq('id', createdOrderHeader.id);

      if (updateError) {
        console.error('[create-order-transactional] Error updating order number:', updateError);
        // If update fails, we'll just fall through and return the order with its default number.
      }
    }
    // ----- [END NEW] LOGIC -----
    
    // Fetch the newly created order with its items to return the full structure
    console.log(`[create-order-transactional] Fetching full order details for ID: ${createdOrderHeader.id}`);
    const { data: fullOrder, error: fetchFullOrderError } = await supabaseAdminClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', createdOrderHeader.id)
        .single();

    if (fetchFullOrderError || !fullOrder) {
        console.error('[create-order-transactional] Failed to fetch full order after creation. Error:', fetchFullOrderError);
        // Return at least the header if the full fetch fails
        return new Response(JSON.stringify({ ...createdOrderHeader, items: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
    }
    console.log("[create-order-transactional] Full order fetched successfully.");

    return new Response(JSON.stringify(fullOrder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('[create-order-transactional] Unhandled error in serve function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred in the Edge Function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[create-order-transactional] Full function module loaded and serve called.");
