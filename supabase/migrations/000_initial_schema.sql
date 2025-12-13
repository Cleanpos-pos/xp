
-- Initial Schema for XP Clean App

-- Drop existing tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS "order_items";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "inventory_items";
DROP TABLE IF EXISTS "catalog_entries";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "staff";
DROP TABLE IF EXISTS "company_settings";
DROP TABLE IF EXISTS "printer_settings";
DROP TABLE IF EXISTS "special_offers";

-- Functions and Policies need to be dropped before the tables they depend on
DROP POLICY IF EXISTS "Allow all access to own customer data" ON "customers";
DROP FUNCTION IF EXISTS "create_order_with_items_tx";

-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    loyalty_status TEXT DEFAULT 'None',
    price_band TEXT DEFAULT 'Standard',
    is_account_client BOOLEAN DEFAULT false,
    account_id TEXT,
    sms_opt_in BOOLEAN DEFAULT false,
    email_opt_in BOOLEAN DEFAULT false,
    has_preferred_pricing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to own customer data" ON customers
    FOR ALL
    USING (true);


-- Create Catalog Entries Table
CREATE TABLE IF NOT EXISTS catalog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES catalog_entries(id) ON DELETE RESTRICT,
    type TEXT NOT NULL, -- 'category' or 'item'
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    has_color_identifier BOOLEAN DEFAULT false,
    small_tags_to_print INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Catalog Entries
ALTER TABLE catalog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to all catalog entries" ON catalog_entries
    FOR SELECT
    USING (true);
CREATE POLICY "Allow authenticated users to manage catalog" ON catalog_entries
    FOR ALL
    USING (auth.role() = 'authenticated');


-- Create Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER DEFAULT 0,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTamptz DEFAULT now()
);
-- RLS for Inventory
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to inventory" ON inventory_items
    FOR ALL
    USING (true);


-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    cart_discount_amount NUMERIC(10, 2),
    cart_discount_percentage NUMERIC(5, 2),
    cart_price_override NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Received',
    payment_status TEXT DEFAULT 'Unpaid',
    notes TEXT,
    is_express BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to orders" ON orders
    FOR ALL
    USING (true);


-- Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_item_id UUID NOT NULL REFERENCES catalog_entries(id),
    service_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    original_unit_price NUMERIC(10, 2),
    item_discount_amount NUMERIC(10, 2),
    item_discount_percentage NUMERIC(5, 2),
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    has_color_identifier BOOLEAN,
    color_value TEXT
);
-- RLS for Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to order items" ON order_items
    FOR ALL
    USING (true);


-- Create Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clerk',
    enable_quick_login BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to staff" ON staff
    FOR ALL
    USING (true);


-- Create Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
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
    delivery_fee_base_gbp NUMERIC(10, 2),
    delivery_fee_per_mile_gbp NUMERIC(10, 2),
    delivery_fee_minimum_gbp NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Company Settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to company settings" ON company_settings
    FOR ALL
    USING (true);


-- Create Printer Settings Table
CREATE TABLE IF NOT EXISTS printer_settings (
    id TEXT PRIMARY KEY,
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    small_tag_print_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Printer Settings
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to printer settings" ON printer_settings
    FOR ALL
    USING (true);


-- Create Special Offers Table
CREATE TABLE IF NOT EXISTS special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    buy_x_items INTEGER,
    pay_for_y_items INTEGER,
    bundle_item_count INTEGER,
    bundle_price NUMERIC(10, 2),
    spend_threshold NUMERIC(10, 2),
    free_item_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS for Special Offers
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to special offers" ON special_offers
    FOR ALL
    USING (true);


-- Transactional Function to Create Order and Items
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
    item_data JSONB;
BEGIN
    -- Insert the order and get the new ID
    INSERT INTO orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount,
        cart_discount_percentage, cart_price_override, total_amount, status,
        payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount,
        p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status,
        p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING orders.id INTO new_order_id;

    -- Loop through the items JSON array and insert each item
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, service_item_id, service_name, quantity, unit_price,
            original_unit_price, item_discount_amount, item_discount_percentage, total_price,
            notes, has_color_identifier, color_value
        ) VALUES (
            new_order_id,
            (item_data->>'service_item_id')::UUID,
            item_data->>'service_name',
            (item_data->>'quantity')::INTEGER,
            (item_data->>'unit_price')::NUMERIC,
            (item_data->>'original_unit_price')::NUMERIC,
            (item_data->>'item_discount_amount')::NUMERIC,
            (item_data->>'item_discount_percentage')::NUMERIC,
            (item_data->>'total_price')::NUMERIC,
            item_data->>'notes',
            (item_data->>'has_color_identifier')::BOOLEAN,
            item_data->>'color_value'
        );
    END LOOP;

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM orders WHERE orders.id = new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION create_order_with_items_tx TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items_tx TO anon;
GRANT EXECUTE ON FUNCTION create_order_with_items_tx TO service_role;
