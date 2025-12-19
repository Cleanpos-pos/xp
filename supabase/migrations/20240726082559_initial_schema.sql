
-- Drop the function if it exists with the old signature
DROP FUNCTION IF EXISTS create_order_with_items_tx(uuid,text,numeric,numeric,numeric,numeric,numeric,text,text,text,boolean,timestamp with time zone,jsonb);

-- Create all tables

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

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    enable_quick_login BOOLEAN DEFAULT false,
    role TEXT NOT NULL DEFAULT 'clerk',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES catalog_entries(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('category', 'item')),
    price NUMERIC(10, 2),
    description TEXT,
    has_color_identifier BOOLEAN DEFAULT false,
    small_tags_to_print INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name TEXT,
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    cart_discount_amount NUMERIC(10, 2),
    cart_discount_percentage NUMERIC(5, 2),
    cart_price_override NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Received',
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    notes TEXT,
    is_express BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_item_id UUID,
    service_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    original_unit_price NUMERIC(10, 2),
    item_discount_amount NUMERIC(10, 2),
    item_discount_percentage NUMERIC(5, 2),
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    has_color_identifier BOOLEAN,
    color_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_logo_url TEXT,
    vat_tax_id TEXT,
    vat_sales_tax_rate NUMERIC,
    include_vat_in_prices BOOLEAN,
    selected_currency TEXT,
    selected_language TEXT,
    available_collection_schedule JSONB,
    available_delivery_schedule JSONB,
    stripe_connect_account_id TEXT,
    enable_platform_fee_pass_through BOOLEAN,
    delivery_fee_base_gbp NUMERIC,
    delivery_fee_per_mile_gbp NUMERIC,
    delivery_fee_minimum_gbp NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier TEXT NOT NULL UNIQUE,
    is_active BOOLEAN,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    buy_x_items INTEGER,
    pay_for_y_items INTEGER,
    bundle_item_count INTEGER,
    bundle_price NUMERIC,
    spend_threshold NUMERIC,
    free_item_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- Function to create an order and its items in a single transaction
CREATE OR REPLACE FUNCTION create_order_with_items_tx(
    p_customer_id uuid,
    p_customer_name text,
    p_subtotal_amount numeric,
    p_cart_discount_amount numeric,
    p_cart_discount_percentage numeric,
    p_cart_price_override numeric,
    p_total_amount numeric,
    p_status text,
    p_payment_status text,
    p_notes text,
    p_is_express boolean,
    p_due_date timestamptz,
    p_items jsonb
)
RETURNS TABLE (
    id uuid,
    order_number text,
    customer_id uuid,
    customer_name text,
    subtotal_amount numeric,
    cart_discount_amount numeric,
    cart_discount_percentage numeric,
    cart_price_override numeric,
    total_amount numeric,
    status text,
    payment_status text,
    notes text,
    is_express boolean,
    due_date timestamptz,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
DECLARE
    new_order_id uuid;
    item_data jsonb;
BEGIN
    -- Insert the order
    INSERT INTO orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING orders.id INTO new_order_id;

    -- Insert order items
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
            total_price,
            notes,
            has_color_identifier,
            color_value
        ) VALUES (
            new_order_id,
            (item_data->>'service_item_id')::uuid,
            item_data->>'service_name',
            (item_data->>'quantity')::integer,
            (item_data->>'unit_price')::numeric,
            (item_data->>'original_unit_price')::numeric,
            (item_data->>'item_discount_amount')::numeric,
            (item_data->>'item_discount_percentage')::numeric,
            (item_data->>'total_price')::numeric,
            item_data->>'notes',
            (item_data->>'has_color_identifier')::boolean,
            item_data->>'color_value'
        );
    END LOOP;

    -- Return the newly created order details
    RETURN QUERY SELECT * FROM orders WHERE orders.id = new_order_id;
END;
$$ LANGUAGE plpgsql;


-- Enable Row Level Security for all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating them
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to manage order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage staff" ON staff;
DROP POLICY IF EXISTS "Allow authenticated users to manage catalog" ON catalog_entries;
DROP POLICY IF EXISTS "Allow all users to read company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow all users to read printer settings" ON printer_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage printer settings" ON printer_settings;
DROP POLICY IF EXISTS "Allow all users to read special offers" ON special_offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage special offers" ON special_offers;


-- Create Row Level Security policies
CREATE POLICY "Allow authenticated users to manage customers"
ON customers FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage orders"
ON orders FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage order_items"
ON order_items FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage inventory"
ON inventory_items FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage staff"
ON staff FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage catalog"
ON catalog_entries FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow all users to read company settings"
ON company_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage company settings"
ON company_settings FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow all users to read printer settings"
ON printer_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage printer settings"
ON printer_settings FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow all users to read special offers"
ON special_offers FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage special offers"
ON special_offers FOR ALL
TO authenticated
USING (true);

-- Create the 'logos' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;

CREATE POLICY "Allow public read access to logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Grant usage on schema to roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Grant select on all tables to roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Allow all actions on all tables to postgres, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, service_role;
