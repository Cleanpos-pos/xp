
-- Drop the function if it exists to allow for changes in return type or arguments
DROP FUNCTION IF EXISTS create_order_with_items_tx(uuid,text,numeric,numeric,numeric,numeric,numeric,text,text,text,boolean,timestamp with time zone,jsonb);

-- Create the initial database schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    login_id text NOT NULL UNIQUE,
    hashed_password text NOT NULL,
    role text NOT NULL DEFAULT 'clerk', -- e.g., 'clerk', 'admin', 'super_admin'
    enable_quick_login boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Catalog Entries Table (for services and categories)
CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    parent_id uuid REFERENCES public.catalog_entries(id) ON DELETE SET NULL,
    type text NOT NULL, -- 'category' or 'item'
    price numeric(10, 2),
    description text,
    sort_order integer DEFAULT 0,
    has_color_identifier boolean,
    small_tags_to_print integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number text,
    customer_id uuid REFERENCES public.customers(id),
    customer_name text, -- Denormalized for easy display
    subtotal_amount numeric(10, 2),
    cart_discount_amount numeric(10, 2),
    cart_discount_percentage numeric(5, 2),
    cart_price_override numeric(10, 2),
    total_amount numeric(10, 2) NOT NULL,
    status text NOT NULL,
    payment_status text,
    notes text,
    is_express boolean DEFAULT false,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id uuid,
    service_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10, 2) NOT NULL,
    original_unit_price numeric(10, 2),
    item_discount_amount numeric(10, 2),
    item_discount_percentage numeric(5, 2),
    total_price numeric(10, 2) NOT NULL,
    notes text,
    has_color_identifier boolean,
    color_value text
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    quantity integer NOT NULL,
    unit text,
    low_stock_threshold integer,
    last_restocked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id text PRIMARY KEY, -- a single row with a fixed ID like 'global_settings'
    company_name text,
    company_address text,
    company_phone text,
    company_logo_url text,
    vat_tax_id text,
    vat_sales_tax_rate numeric(5, 2),
    include_vat_in_prices boolean DEFAULT true,
    selected_currency text DEFAULT 'GBP',
    selected_language text DEFAULT 'en',
    available_collection_schedule jsonb,
    available_delivery_schedule jsonb,
    stripe_connect_account_id text,
    enable_platform_fee_pass_through boolean DEFAULT false,
    delivery_fee_base_gbp numeric(10, 2),
    delivery_fee_per_mile_gbp numeric(10, 2),
    delivery_fee_minimum_gbp numeric(10, 2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Printer Settings Table
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id text PRIMARY KEY, -- a single row with a fixed ID like 'global_printer_settings'
    receipt_printer text,
    customer_receipt_copies text,
    stub_printer text,
    receipt_header text,
    receipt_footer text,
    small_tag_print_settings jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Special Offers Table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    offer_type_identifier text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    notes text,
    buy_x_items integer,
    pay_for_y_items integer,
    bundle_item_count integer,
    bundle_price numeric(10, 2),
    spend_threshold numeric(10, 2),
    free_item_description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
    due_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
DECLARE
    new_order_id uuid;
    item_data jsonb;
BEGIN
    -- Insert the order
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING public.orders.id INTO new_order_id;

    -- Insert order items
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price, original_unit_price, item_discount_amount, item_discount_percentage, total_price, notes, has_color_identifier, color_value
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

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM public.orders WHERE public.orders.id = new_order_id;
END;
$$ LANGUAGE plpgsql;


-- Set up Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Policies for customers
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON public.customers;
CREATE POLICY "Allow authenticated users to manage customers" ON public.customers FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for staff
DROP POLICY IF EXISTS "Allow authenticated users to view staff" ON public.staff;
CREATE POLICY "Allow authenticated users to view staff" ON public.staff FOR SELECT
USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admin users to manage staff" ON public.staff;
CREATE POLICY "Allow admin users to manage staff" ON public.staff FOR ALL
USING (auth.role() = 'authenticated'); -- Simplified for prototype, refine for prod

-- Policies for catalog_entries
DROP POLICY IF EXISTS "Allow authenticated users to read catalog" ON public.catalog_entries;
CREATE POLICY "Allow authenticated users to read catalog" ON public.catalog_entries FOR SELECT
USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admin users to manage catalog" ON public.catalog_entries;
CREATE POLICY "Allow admin users to manage catalog" ON public.catalog_entries FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for orders
DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON public.orders;
CREATE POLICY "Allow authenticated users to manage orders" ON public.orders FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for order_items
DROP POLICY IF EXISTS "Allow authenticated users to manage order items" ON public.order_items;
CREATE POLICY "Allow authenticated users to manage order items" ON public.order_items FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for inventory_items
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON public.inventory_items;
CREATE POLICY "Allow authenticated users to manage inventory" ON public.inventory_items FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for company_settings
DROP POLICY IF EXISTS "Allow authenticated users to manage company settings" ON public.company_settings;
CREATE POLICY "Allow authenticated users to manage company settings" ON public.company_settings FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for printer_settings
DROP POLICY IF EXISTS "Allow authenticated users to manage printer settings" ON public.printer_settings;
CREATE POLICY "Allow authenticated users to manage printer settings" ON public.printer_settings FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for special_offers
DROP POLICY IF EXISTS "Allow authenticated users to manage special offers" ON public.special_offers;
CREATE POLICY "Allow authenticated users to manage special offers" ON public.special_offers FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for Supabase Storage
-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for storage.objects (logos bucket)
DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
CREATE POLICY "Allow public read access to logos" ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update their own logos" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own logos" ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated'); -- Add owner check if needed

DROP POLICY IF EXISTS "Allow authenticated users to delete their own logos" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own logos" ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated'); -- Add owner check if needed
