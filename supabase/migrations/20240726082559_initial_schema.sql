-- Drop existing function to avoid conflict
DROP FUNCTION IF EXISTS public.create_order_with_items_tx(uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, timestamp with time zone, jsonb);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    loyalty_status text,
    price_band text,
    is_account_client boolean DEFAULT false,
    account_id text,
    sms_opt_in boolean DEFAULT false,
    email_opt_in boolean DEFAULT false,
    has_preferred_pricing boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    login_id text NOT NULL UNIQUE,
    hashed_password text NOT NULL,
    enable_quick_login boolean DEFAULT false NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    quantity integer NOT NULL,
    unit text NOT NULL,
    low_stock_threshold integer,
    last_restocked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Catalog Entries Table (for services and categories)
CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    parent_id uuid REFERENCES public.catalog_entries(id) ON DELETE RESTRICT,
    type text NOT NULL,
    price numeric,
    description text,
    sort_order integer NOT NULL DEFAULT 0,
    has_color_identifier boolean,
    small_tags_to_print integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    order_number text UNIQUE,
    customer_id uuid REFERENCES public.customers(id),
    customer_name text,
    subtotal_amount numeric,
    cart_discount_amount numeric,
    cart_discount_percentage numeric,
    cart_price_override numeric,
    total_amount numeric NOT NULL,
    status text NOT NULL,
    payment_status text,
    notes text,
    is_express boolean DEFAULT false,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id uuid REFERENCES public.catalog_entries(id),
    service_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    original_unit_price numeric,
    item_discount_amount numeric,
    item_discount_percentage numeric,
    total_price numeric NOT NULL,
    notes text,
    has_color_identifier boolean,
    color_value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id text NOT NULL PRIMARY KEY,
    company_name text,
    company_address text,
    company_phone text,
    company_logo_url text,
    vat_tax_id text,
    vat_sales_tax_rate numeric,
    include_vat_in_prices boolean DEFAULT true,
    selected_currency text DEFAULT 'GBP',
    selected_language text DEFAULT 'en',
    available_collection_schedule jsonb,
    available_delivery_schedule jsonb,
    stripe_connect_account_id text,
    enable_platform_fee_pass_through boolean DEFAULT false,
    delivery_fee_base_gbp numeric,
    delivery_fee_per_mile_gbp numeric,
    delivery_fee_minimum_gbp numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Printer Settings Table
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id text NOT NULL PRIMARY KEY,
    receipt_printer text,
    customer_receipt_copies text,
    stub_printer text,
    receipt_header text,
    receipt_footer text,
    small_tag_print_settings jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Special Offers Table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    offer_type_identifier text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    notes text,
    buy_x_items integer,
    pay_for_y_items integer,
    bundle_item_count integer,
    bundle_price numeric,
    spend_threshold numeric,
    free_item_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Function to create an order and its items in a single transaction
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
    p_due_date timestamp with time zone,
    p_items jsonb
) RETURNS SETOF orders -- Changed to return a setof the orders table type
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id uuid;
    v_order_header orders;
    item jsonb;
BEGIN
    -- Insert the order header
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date, created_at, updated_at
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date, now(), now()
    ) RETURNING id INTO v_order_id;

    -- Loop through the items and insert them
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price, original_unit_price, item_discount_amount, item_discount_percentage, total_price, notes, has_color_identifier, color_value, created_at, updated_at
        ) VALUES (
            v_order_id,
            (item->>'service_item_id')::uuid,
            item->>'service_name',
            (item->>'quantity')::integer,
            (item->>'unit_price')::numeric,
            (item->>'original_unit_price')::numeric,
            (item->>'item_discount_amount')::numeric,
            (item->>'item_discount_percentage')::numeric,
            (item->>'total_price')::numeric,
            item->>'notes',
            (item->>'has_color_identifier')::boolean,
            item->>'color_value',
            now(),
            now()
        );
    END LOOP;

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM public.orders WHERE id = v_order_id;
END;
$$;


-- RLS POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update customers" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service_role to manage staff" ON public.staff FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow users to read their own staff data" ON public.staff FOR SELECT TO authenticated USING (auth.uid() = id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read company_settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role to manage company_settings" ON public.company_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read printer_settings" ON public.printer_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role to manage printer_settings" ON public.printer_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read special_offers" ON public.special_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role to manage special_offers" ON public.special_offers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Disable RLS for catalog_entries as it should be public
ALTER TABLE public.catalog_entries DISABLE ROW LEVEL SECURITY;


-- STORAGE BUCKET AND POLICIES FOR LOGOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 1048576, allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to update their own logos" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'logos');
