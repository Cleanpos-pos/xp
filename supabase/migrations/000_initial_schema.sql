-- Initial Schema for XP Clean Application

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.customers;
CREATE POLICY "Allow all access to authenticated users" ON public.customers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create Catalog Entries table
CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.catalog_entries(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('category', 'item')),
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    has_color_identifier BOOLEAN,
    small_tags_to_print INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Catalog Entries table
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.catalog_entries;
CREATE POLICY "Allow read access for all users" ON public.catalog_entries
    FOR SELECT
    USING (true);
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.catalog_entries;
CREATE POLICY "Allow write access for authenticated users" ON public.catalog_entries
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.orders;
CREATE POLICY "Allow all access to authenticated users" ON public.orders
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Order Items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.order_items;
CREATE POLICY "Allow all access to authenticated users" ON public.order_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create Staff table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clerk',
    enable_quick_login BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.staff;
CREATE POLICY "Allow all access to authenticated users" ON public.staff
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- Create Inventory Items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER DEFAULT 0,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Inventory Items table
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.inventory_items;
CREATE POLICY "Allow all access to authenticated users" ON public.inventory_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- Create Company Settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Company Settings table
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.company_settings;
CREATE POLICY "Allow all access to authenticated users" ON public.company_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create Printer Settings table
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id TEXT PRIMARY KEY,
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    small_tag_print_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Printer Settings table
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.printer_settings;
CREATE POLICY "Allow all access to authenticated users" ON public.printer_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- Create Special Offers table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_type_identifier TEXT NOT NULL UNIQUE,
    is_active BOOLEAN,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    buy_x_items INTEGER,
    pay_for_y_items INTEGER,
    bundle_item_count INTEGER,
    bundle_price NUMERIC(10, 2),
    spend_threshold NUMERIC(10, 2),
    free_item_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Special Offers table
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.special_offers;
CREATE POLICY "Allow all access to authenticated users" ON public.special_offers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Transactional function to create an order and its items
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
    p_items JSONB
)
RETURNS SETOF public.orders AS $$
DECLARE
    new_order_id UUID;
    item JSONB;
BEGIN
    -- Insert the order header
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount,
        cart_discount_percentage, cart_price_override, total_amount, status,
        payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount,
        p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status,
        p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING id INTO new_order_id;

    -- Loop through the items and insert them
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price,
            original_unit_price, item_discount_amount, item_discount_percentage,
            total_price, notes, has_color_identifier, color_value
        ) VALUES (
            new_order_id,
            item->>'service_item_id',
            item->>'service_name',
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::NUMERIC,
            (item->>'original_unit_price')::NUMERIC,
            (item->>'item_discount_amount')::NUMERIC,
            (item->>'item_discount_percentage')::NUMERIC,
            (item->>'total_price')::NUMERIC,
            item->>'notes',
            (item->>'has_color_identifier')::BOOLEAN,
            item->>'color_value'
        );
    END LOOP;

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM public.orders WHERE id = new_order_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execution of the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, JSONB) TO authenticated;
