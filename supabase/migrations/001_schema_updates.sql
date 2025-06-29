
-- ### 1. Enhance `customers` table for account clients and preferences
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_account_client BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_preferred_pricing BOOLEAN DEFAULT false;

-- ### 2. Enhance `staff` table for roles and active status
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'clerk';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- ### 3. Enhance `orders` and `order_items` for advanced pricing and notes
-- Add new pricing fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_discount_amount NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_discount_percentage NUMERIC(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_price_override NUMERIC(10, 2);

-- Add new pricing and note fields to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_discount_amount NUMERIC(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_discount_percentage NUMERIC(5, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS has_color_identifier BOOLEAN DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color_value TEXT;

-- ### 4. Enhance `catalog_entries` for color identifier
ALTER TABLE catalog_entries ADD COLUMN IF NOT EXISTS has_color_identifier BOOLEAN DEFAULT false;

-- ### 5. Create `company_settings` table for scheduling, fees, etc.
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_logo_url TEXT,
    vat_tax_id TEXT,
    vat_sales_tax_rate NUMERIC(5, 2),
    include_vat_in_prices BOOLEAN DEFAULT true,
    selected_currency TEXT DEFAULT 'GBP',
    selected_language TEXT DEFAULT 'en',
    available_collection_schedule JSONB,
    available_delivery_schedule JSONB,
    stripe_connect_account_id TEXT,
    enable_platform_fee_pass_through BOOLEAN DEFAULT false,
    delivery_fee_base_gbp NUMERIC(10, 2) DEFAULT 0,
    delivery_fee_per_mile_gbp NUMERIC(10, 2) DEFAULT 0,
    delivery_fee_minimum_gbp NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ### 6. Create `printer_settings` table
CREATE TABLE IF NOT EXISTS printer_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_printer_settings',
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ### 7. Create `special_offers` table
CREATE TABLE IF NOT EXISTS special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier TEXT UNIQUE NOT NULL, -- e.g., 'BUY_X_GET_Y'
    is_active BOOLEAN DEFAULT false,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    -- Fields for "Buy X Get Y"
    buy_x_items INT,
    pay_for_y_items INT,
    -- Fields for "Bundle Deal"
    bundle_item_count INT,
    bundle_price NUMERIC(10, 2),
    -- Fields for "Spend & Get"
    spend_threshold NUMERIC(10, 2),
    free_item_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ### 8. Create PostgreSQL Function for Transactional Order Creation
-- This ensures that creating an order and its associated items happens atomically.
-- It's defined here and called from the Supabase Edge Function.

CREATE OR REPLACE FUNCTION create_order_with_items_tx(
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
) AS $$
DECLARE
    new_order_id UUID;
    item RECORD;
BEGIN
    -- Insert the order and get its ID
    INSERT INTO orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, 
        total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override,
        p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING orders.id INTO new_order_id;

    -- Loop through the items JSON array and insert each one
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        service_item_id UUID,
        service_name TEXT,
        quantity INT,
        unit_price NUMERIC,
        original_unit_price NUMERIC,
        item_discount_amount NUMERIC,
        item_discount_percentage NUMERIC,
        total_price NUMERIC,
        notes TEXT,
        has_color_identifier BOOLEAN,
        color_value TEXT
    )
    LOOP
        INSERT INTO order_items (
            order_id, service_item_id, service_name, quantity, unit_price, original_unit_price, 
            item_discount_amount, item_discount_percentage, total_price, notes,
            has_color_identifier, color_value
        ) VALUES (
            new_order_id, item.service_item_id, item.service_name, item.quantity, item.unit_price, item.original_unit_price,
            item.item_discount_amount, item.item_discount_percentage, item.total_price, item.notes,
            item.has_color_identifier, item.color_value
        );
    END LOOP;

    -- Return the newly created order header
    RETURN QUERY SELECT o.id, o.order_number, o.customer_id, o.customer_name, o.subtotal_amount, o.cart_discount_amount, 
                        o.cart_discount_percentage, o.cart_price_override, o.total_amount, o.status, o.payment_status, 
                        o.notes, o.is_express, o.due_date, o.created_at, o.updated_at
                 FROM orders o
                 WHERE o.id = new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Grant usage on the function to the authenticated role so the Edge Function can call it
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(UUID,TEXT,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT,TEXT,TEXT,BOOLEAN,TIMESTAMPTZ,JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(UUID,TEXT,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT,TEXT,TEXT,BOOLEAN,TIMESTAMPTZ,JSONB) TO service_role;

-- Note on security: Consider revoking default public privileges if necessary
-- REVOKE EXECUTE ON FUNCTION public.create_order_with_items_tx FROM PUBLIC;
