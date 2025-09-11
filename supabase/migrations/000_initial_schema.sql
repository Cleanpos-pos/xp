
-- Drop policies, functions, and tables if they exist
DROP POLICY IF EXISTS "Enable all access for anon and authenticated users" ON "public"."special_offers";
DROP POLICY IF EXISTS "Enable all access for anon and authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.customers;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.orders;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.order_items;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.inventory_items;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.catalog_entries;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.company_settings;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.printer_settings;

DROP FUNCTION IF EXISTS public.create_order_with_items_tx(text, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, timestamptz, jsonb);

DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.staff;
DROP TABLE IF EXISTS public.catalog_entries;
DROP TABLE IF EXISTS public.company_settings;
DROP TABLE IF EXISTS public.printer_settings;
DROP TABLE IF EXISTS public.special_offers;


-- Create tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    loyalty_status TEXT,
    price_band TEXT,
    is_account_client BOOLEAN DEFAULT false,
    account_id TEXT,
    sms_opt_in BOOLEAN DEFAULT false,
    email_opt_in BOOLEAN DEFAULT false,
    has_preferred_pricing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    cart_discount_amount NUMERIC(10, 2),
    cart_discount_percentage NUMERIC(5, 2),
    cart_price_override NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL,
    payment_status TEXT,
    notes TEXT,
    is_express BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id TEXT,
    service_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    original_unit_price NUMERIC(10, 2),
    item_discount_amount NUMERIC(10, 2),
    item_discount_percentage NUMERIC(5, 2),
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    has_color_identifier BOOLEAN DEFAULT false,
    color_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    enable_quick_login BOOLEAN DEFAULT false,
    role TEXT NOT NULL DEFAULT 'clerk',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.catalog_entries(id) ON DELETE RESTRICT,
    type TEXT NOT NULL,
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    has_color_identifier BOOLEAN,
    small_tags_to_print INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_logo_url TEXT,
    vat_tax_id TEXT,
    vat_sales_tax_rate NUMERIC(5, 4),
    include_vat_in_prices BOOLEAN,
    selected_currency TEXT,
    selected_language TEXT,
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

CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier TEXT UNIQUE NOT NULL,
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

-- Policies
CREATE POLICY "Enable all for users based on user_id" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.orders FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.staff FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.catalog_entries FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.company_settings FOR ALL USING (true);
CREATE POLICY "Enable all for users based on user_id" ON public.printer_settings FOR ALL USING (true);
CREATE POLICY "Enable all access for anon and authenticated users" ON "public"."special_offers" FOR ALL USING (true) WITH CHECK (true);


-- Transactional function for creating an order and its items
CREATE OR REPLACE FUNCTION public.create_order_with_items_tx(
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
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_order_id uuid;
    item_data jsonb;
BEGIN
    -- Insert the order and get the new ID
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING public.orders.id INTO new_order_id;

    -- Loop through the items JSON array and insert them
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price, original_unit_price, item_discount_amount, item_discount_percentage, total_price, notes, has_color_identifier, color_value
        ) VALUES (
            new_order_id,
            item_data->>'service_item_id',
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

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM public.orders WHERE public.orders.id = new_order_id;
END;
$$;
