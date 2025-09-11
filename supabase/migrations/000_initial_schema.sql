
-- Initial Schema for XP Clean App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
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
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL TO authenticated USING (true);


-- Staff Table
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
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage staff" ON public.staff FOR ALL TO authenticated USING (true);


-- Catalog Entries Table
CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.catalog_entries(id) ON DELETE RESTRICT,
    type TEXT NOT NULL, -- 'category' or 'item'
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    has_color_identifier BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage catalog" ON public.catalog_entries FOR ALL TO authenticated USING (true);


-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE, -- Should be set by trigger or function
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    customer_name TEXT NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage orders" ON public.orders FOR ALL TO authenticated USING (true);


-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id UUID, -- Can be null if it's a custom item
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTamptz DEFAULT NOW()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage order items" ON public.order_items FOR ALL TO authenticated USING (true);


-- Inventory Items Table
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
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (true);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY, -- 'global_settings'
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
    enable_platform_fee_pass_through BOOLEAN,
    delivery_fee_base_gbp NUMERIC(10, 2),
    delivery_fee_per_mile_gbp NUMERIC(10, 2),
    delivery_fee_minimum_gbp NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage company settings" ON public.company_settings FOR ALL TO authenticated USING (true);


-- Printer Settings Table
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id TEXT PRIMARY KEY, -- 'global_printer_settings'
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage printer settings" ON public.printer_settings FOR ALL TO authenticated USING (true);


-- Special Offers Table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage special offers" ON public.special_offers FOR ALL TO authenticated USING (true);


-- PG Function to create an order and its items transactionally
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
    id UUID, order_number TEXT, customer_id UUID, customer_name TEXT, subtotal_amount NUMERIC,
    cart_discount_amount NUMERIC, cart_discount_percentage NUMERIC, cart_price_override NUMERIC,
    total_amount NUMERIC, status TEXT, payment_status TEXT, notes TEXT, is_express BOOLEAN,
    due_date TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
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
    ) RETURNING public.orders.id INTO new_order_id;

    -- Loop through the items and insert them
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price,
            original_unit_price, item_discount_amount, item_discount_percentage,
            total_price, notes, has_color_identifier, color_value
        ) VALUES (
            new_order_id,
            (item->>'service_item_id')::UUID,
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
    RETURN QUERY SELECT * FROM public.orders WHERE public.orders.id = new_order_id;
END;
$$ LANGUAGE plpgsql;
