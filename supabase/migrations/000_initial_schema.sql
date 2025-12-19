
-- Drop policies if they exist before dropping tables, to avoid dependency errors.
DROP POLICY IF EXISTS "Allow public read access to catalog" ON public.catalog_entries;

-- Drop tables in reverse order of creation to handle dependencies.
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.catalog_entries;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.staff;
DROP TABLE IF EXISTS public.company_settings;
DROP TABLE IF EXISTS public.printer_settings;
DROP TABLE IF EXISTS public.special_offers;

-- Drop custom types if they exist.
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.order_status;
DROP TYPE IF EXISTS public.payment_status;
DROP TYPE IF EXISTS public.catalog_entry_type;
DROP TYPE IF EXISTS public.special_offer_type;

-- Create custom enum types if they don't exist.
CREATE TYPE public.user_role AS ENUM ('clerk', 'admin', 'super_admin');
CREATE TYPE public.order_status AS ENUM ('Received', 'Processing', 'Cleaning', 'Alterations', 'Ready for Pickup', 'Completed', 'Cancelled');
CREATE TYPE public.payment_status AS ENUM ('Paid', 'Unpaid', 'Processing Payment', 'Refunded');
CREATE TYPE public.catalog_entry_type AS ENUM ('category', 'item');
CREATE TYPE public.special_offer_type AS ENUM ('BUY_X_GET_Y', 'BUNDLE_DEAL', 'SPEND_GET_FREE_ITEM');


-- Create staff table with roles and active status.
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL, -- NOTE: In a real app, this should be a properly hashed password.
    role user_role DEFAULT 'clerk',
    enable_quick_login BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table.
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
    created_at TIMESTAMTz DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create catalog entries table for services and categories.
CREATE TABLE IF NOT EXISTS public.catalog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.catalog_entries(id) ON DELETE SET NULL,
    type catalog_entry_type NOT NULL,
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    has_color_identifier BOOLEAN,
    small_tags_to_print INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_items table.
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table.
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    cart_discount_amount NUMERIC(10, 2),
    cart_discount_percentage NUMERIC(5, 2),
    cart_price_override NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL,
    payment_status payment_status,
    notes TEXT,
    is_express BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table.
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
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

-- Create company_settings table for singleton settings.
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY, -- a single row with a fixed ID like 'global_settings'
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_logo_url TEXT,
    vat_tax_id TEXT,
    vat_sales_tax_rate NUMERIC(5, 2),
    include_vat_in_prices BOOLEAN DEFAULT true,
    selected_currency VARCHAR(3) DEFAULT 'GBP',
    selected_language VARCHAR(5) DEFAULT 'en',
    available_collection_schedule JSONB,
    available_delivery_schedule JSONB,
    stripe_connect_account_id TEXT,
    enable_platform_fee_pass_through BOOLEAN,
    delivery_fee_base_gbp NUMERIC(10, 2),
    delivery_fee_per_mile_gbp NUMERIC(10, 2),
    delivery_fee_minimum_gbp NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create printer_settings table for singleton printer settings.
CREATE TABLE IF NOT EXISTS public.printer_settings (
    id TEXT PRIMARY KEY, -- a single row with a fixed ID like 'global_printer_settings'
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    small_tag_print_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create special_offers table.
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier special_offer_type NOT NULL UNIQUE,
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drop transactional function if it exists.
DROP FUNCTION IF EXISTS public.create_order_with_items_tx(
    p_customer_id uuid,
    p_customer_name text,
    p_subtotal_amount numeric,
    p_cart_discount_amount numeric,
    p_cart_discount_percentage numeric,
    p_cart_price_override numeric,
    p_total_amount numeric,
    p_status order_status,
    p_payment_status payment_status,
    p_notes text,
    p_is_express boolean,
    p_due_date timestamptz,
    p_items jsonb
);

-- Create transactional function for creating an order with items.
CREATE OR REPLACE FUNCTION public.create_order_with_items_tx(
    p_customer_id uuid,
    p_customer_name text,
    p_subtotal_amount numeric,
    p_cart_discount_amount numeric,
    p_cart_discount_percentage numeric,
    p_cart_price_override numeric,
    p_total_amount numeric,
    p_status order_status,
    p_payment_status payment_status,
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
    status order_status,
    payment_status payment_status,
    notes text,
    is_express boolean,
    due_date timestamptz,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
DECLARE
    new_order_id uuid;
    new_order_number text;
    item jsonb;
BEGIN
    -- Temporary order number, to be updated by Edge Function
    new_order_number := 'TEMP-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(md5(random()::text), 1, 4);

    -- Insert the order
    INSERT INTO public.orders (
        order_number, customer_id, customer_name, subtotal_amount, cart_discount_amount,
        cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        new_order_number, p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount,
        p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING public.orders.id INTO new_order_id;

    -- Insert each item from the JSONB array
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price, original_unit_price,
            item_discount_amount, item_discount_percentage, total_price, notes, has_color_identifier, color_value
        ) VALUES (
            new_order_id,
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
            item->>'color_value'
        );
    END LOOP;

    -- Return the newly created order's header
    RETURN QUERY SELECT * FROM public.orders WHERE public.orders.id = new_order_id;
END;
$$ LANGUAGE plpgsql;


-- Set up Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_entries DISABLE ROW LEVEL SECURITY; -- ** THE FIX: Disable RLS for catalog **


-- Policies for 'customers' table.
DROP POLICY IF EXISTS "Allow all users to manage customers" ON public.customers;
CREATE POLICY "Allow all users to manage customers" ON public.customers
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'orders' table.
DROP POLICY IF EXISTS "Allow all users to manage orders" ON public.orders;
CREATE POLICY "Allow all users to manage orders" ON public.orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'order_items' table.
DROP POLICY IF EXISTS "Allow all users to manage order items" ON public.order_items;
CREATE POLICY "Allow all users to manage order items" ON public.order_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'inventory_items' table.
DROP POLICY IF EXISTS "Allow all users to manage inventory items" ON public.inventory_items;
CREATE POLICY "Allow all users to manage inventory items" ON public.inventory_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'staff' table.
DROP POLICY IF EXISTS "Allow all users to manage staff" ON public.staff;
CREATE POLICY "Allow all users to manage staff" ON public.staff
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'company_settings' table.
DROP POLICY IF EXISTS "Allow all users to manage company settings" ON public.company_settings;
CREATE POLICY "Allow all users to manage company settings" ON public.company_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'printer_settings' table.
DROP POLICY IF EXISTS "Allow all users to manage printer settings" ON public.printer_settings;
CREATE POLICY "Allow all users to manage printer settings" ON public.printer_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies for 'special_offers' table.
DROP POLICY IF EXISTS "Allow all users to manage special offers" ON public.special_offers;
CREATE POLICY "Allow all users to manage special offers" ON public.special_offers
FOR ALL
USING (true)
WITH CHECK (true);
