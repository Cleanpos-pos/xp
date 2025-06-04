
-- Function to generate a new order number (e.g., YY-MM-XXXXX)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    year_month_prefix TEXT;
    current_year_month TEXT;
    last_sequence INTEGER;
    next_sequence INTEGER;
BEGIN
    -- Get the current year and month in YY-MM format
    current_year_month := to_char(CURRENT_DATE, 'YY-MM');

    -- Find the last sequence number for the current year and month
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 7 FOR 5)::INTEGER), 0)
    INTO last_sequence
    FROM orders
    WHERE order_number LIKE current_year_month || '-%';

    next_sequence := last_sequence + 1;

    -- Format the new order number: YY-MM-XXXXX (5-digit sequence, zero-padded)
    new_order_number := current_year_month || '-' || LPAD(next_sequence::TEXT, 5, '0');

    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Ensure the order_items table has a foreign key to orders and other necessary columns
-- This is a reminder; ensure your table schema is correct.
-- ALTER TABLE order_items
-- ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
-- Ensure columns like service_item_id, service_name, quantity, unit_price, total_price exist.
-- Ensure 'has_color_identifier' and 'color_value' columns exist in 'order_items' if needed.

-- Function to create an order and its items transactionally
CREATE OR REPLACE FUNCTION create_order_with_items_tx(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_subtotal_amount NUMERIC,
    p_cart_discount_amount NUMERIC DEFAULT NULL,
    p_cart_discount_percentage NUMERIC DEFAULT NULL,
    p_cart_price_override NUMERIC DEFAULT NULL,
    p_total_amount NUMERIC,
    p_status TEXT,
    p_payment_status TEXT,
    p_notes TEXT DEFAULT NULL,
    p_is_express BOOLEAN DEFAULT FALSE,
    p_due_date TIMESTAMPTZ DEFAULT NULL,
    p_items JSONB -- Array of item objects
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
AS $$
DECLARE
    new_order_id UUID;
    new_order_number TEXT;
    item_data JSONB;
BEGIN
    -- Generate the new order number
    new_order_number := generate_order_number();

    -- Insert into orders table
    INSERT INTO orders (
        order_number, customer_id, customer_name,
        subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount,
        status, payment_status, notes, is_express, due_date
    ) VALUES (
        new_order_number, p_customer_id, p_customer_name,
        p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount,
        p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING orders.id INTO new_order_id;

    -- Insert into order_items table
    IF p_items IS NOT NULL THEN
        FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            INSERT INTO order_items (
                order_id,
                service_item_id,
                service_name,
                quantity,
                unit_price,
                original_unit_price,
                item_discount_amount,
                item_discount_percentage,
                total_price, -- This is the effective total for this item line
                notes,
                has_color_identifier,
                color_value
            ) VALUES (
                new_order_id,
                (item_data->>'service_item_id')::UUID, -- Assuming service_item_id is UUID, adjust if not
                item_data->>'service_name',
                (item_data->>'quantity')::INTEGER,
                (item_data->>'unit_price')::NUMERIC,
                (item_data->>'original_unit_price')::NUMERIC,
                (item_data->>'item_discount_amount')::NUMERIC,
                (item_data->>'item_discount_percentage')::NUMERIC,
                (item_data->>'total_price')::NUMERIC,
                item_data->>'notes',
                COALESCE((item_data->>'has_color_identifier')::BOOLEAN, FALSE),
                item_data->>'color_value'
            );
        END LOOP;
    END IF;

    -- Return the newly created order header details
    RETURN QUERY
    SELECT
        o.id, o.order_number, o.customer_id, o.customer_name,
        o.subtotal_amount, o.cart_discount_amount, o.cart_discount_percentage, o.cart_price_override, o.total_amount,
        o.status, o.payment_status, o.notes, o.is_express, o.due_date,
        o.created_at, o.updated_at
    FROM orders o
    WHERE o.id = new_order_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (optional, depends on your Supabase logging setup)
        RAISE WARNING 'Error in create_order_with_items_tx: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        -- Re-raise the exception to ensure transaction rollback
        RAISE;
END;
$$;
