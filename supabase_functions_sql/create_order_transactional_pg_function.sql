
-- Sequence for order_number generation
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Drop the function if it already exists to avoid conflicts during re-creation
DROP FUNCTION IF EXISTS public.create_order_with_items_tx(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_subtotal_amount NUMERIC,
    p_cart_discount_amount NUMERIC,
    p_cart_discount_percentage NUMERIC,
    p_cart_price_override NUMERIC,
    p_total_amount NUMERIC,
    p_status TEXT,
    p_payment_status TEXT,
    p_notes TEXT,
    p_is_express BOOLEAN,
    p_due_date TIMESTAMPTZ,
    p_items JSONB
);

CREATE OR REPLACE FUNCTION public.create_order_with_items_tx(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_subtotal_amount NUMERIC,
    p_cart_discount_amount NUMERIC,
    p_cart_discount_percentage NUMERIC,
    p_cart_price_override NUMERIC,
    p_total_amount NUMERIC,
    p_status TEXT,
    p_payment_status TEXT,
    p_notes TEXT,
    p_is_express BOOLEAN,
    p_due_date TIMESTAMPTZ,
    p_items JSONB -- Expecting an array of item objects:
                  -- [{ service_item_id, service_name, quantity, unit_price, original_unit_price,
                  --    item_discount_amount, item_discount_percentage, total_price, notes,
                  --    has_color_identifier, color_value }]
)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    customer_id UUID,
    customer_name TEXT,
    subtotal_amount NUMERIC,
    cart_discount_amount NUMERIC,
    cart_discount_percentage NUMERIC,
    cart_price_override NUMERIC,
    total_amount NUMERIC,
    status TEXT,
    payment_status TEXT,
    notes TEXT,
    is_express BOOLEAN,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Run with the permissions of the function owner
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    item RECORD;
    v_created_at TIMESTAMPTZ;
    v_updated_at TIMESTAMPTZ;
BEGIN
    v_created_at := now();
    v_updated_at := v_created_at;
    -- Generate order number using sequence
    v_order_number := TO_CHAR(v_created_at, 'YYMMDD') || '-XP-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 4, '0');

    -- Insert into orders table
    INSERT INTO public.orders (
        customer_id, customer_name, order_number,
        subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override,
        total_amount, status, payment_status, notes, is_express, due_date,
        created_at, updated_at
    ) VALUES (
        p_customer_id, p_customer_name, v_order_number,
        p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override,
        p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date,
        v_created_at, v_updated_at
    ) RETURNING public.orders.id INTO v_order_id;

    -- Insert into order_items table
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
        FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
            service_item_id UUID, service_name TEXT, quantity INTEGER, unit_price NUMERIC, original_unit_price NUMERIC,
            item_discount_amount NUMERIC, item_discount_percentage NUMERIC, total_price NUMERIC, notes TEXT,
            has_color_identifier BOOLEAN, color_value TEXT
        )
        LOOP
            INSERT INTO public.order_items (
                order_id, service_item_id, service_name, quantity, unit_price, original_unit_price,
                item_discount_amount, item_discount_percentage, total_price, notes,
                has_color_identifier, color_value, created_at, updated_at
            ) VALUES (
                v_order_id, item.service_item_id, item.service_name, item.quantity, item.unit_price, item.original_unit_price,
                item.item_discount_amount, item.item_discount_percentage, item.total_price, item.notes,
                COALESCE(item.has_color_identifier, FALSE), item.color_value, v_created_at, v_updated_at
            );
        END LOOP;
    END IF;

    -- Return the created order details (header only, items will be fetched by client if needed)
    RETURN QUERY SELECT
        o.id, o.order_number, o.customer_id, o.customer_name, o.subtotal_amount, o.cart_discount_amount,
        o.cart_discount_percentage, o.cart_price_override, o.total_amount, o.status, o.payment_status,
        o.notes, o.is_express, o.due_date, o.created_at, o.updated_at
    FROM public.orders o WHERE o.id = v_order_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error or handle it as needed
        RAISE WARNING 'Error in create_order_with_items_tx: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        -- Rollback is implicit in PL/pgSQL for unhandled exceptions when not caught and handled
        RAISE; -- Re-raise the exception to ensure the transaction is rolled back and Supabase client receives an error
END;
$$;

-- Grant execute permission to the 'authenticated' role (or your specific app role)
-- This allows your Edge Function (when using anon key and user's JWT) to call this database function.
-- If using service_role key in Edge Function to call this, this explicit grant might not be strictly necessary
-- as service_role bypasses RLS and has broader permissions, but it's good practice for clarity.
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(
    UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, JSONB
) TO authenticated;

-- Note: If your RLS policies on 'orders' or 'order_items' prevent inserts even for 'authenticated',
-- the 'SECURITY DEFINER' on the function allows it to run with the permissions of the user who defined it (usually a superuser).
-- Ensure this is appropriate for your security model.

