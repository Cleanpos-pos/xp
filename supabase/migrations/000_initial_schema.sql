
-- Create custom types
CREATE TYPE public.user_role AS ENUM ('clerk', 'admin', 'super_admin');
CREATE TYPE public.order_status AS ENUM ('Received', 'Processing', 'Cleaning', 'Alterations', 'Ready for Pickup', 'Completed', 'Cancelled');
CREATE TYPE public.payment_status AS ENUM ('Paid', 'Unpaid', 'Processing Payment', 'Refunded');
CREATE TYPE public.catalog_entry_type AS ENUM ('category', 'item');
CREATE TYPE public.special_offer_type AS ENUM ('BUY_X_GET_Y', 'BUNDLE_DEAL', 'SPEND_GET_FREE_ITEM');

-- Create Customers table
CREATE TABLE public.customers (
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon users" ON public.customers FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Staff table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    login_id TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role public.user_role DEFAULT 'clerk'::public.user_role,
    enable_quick_login BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon users" ON public.staff FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Catalog Entries table
CREATE TABLE public.catalog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.catalog_entries(id) ON DELETE RESTRICT,
    type public.catalog_entry_type NOT NULL,
    price NUMERIC(10, 2),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    has_color_identifier BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.catalog_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read access for anon users" ON public.catalog_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Enable write access for anon users" ON public.catalog_entries FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    subtotal_amount NUMERIC(10, 2),
    cart_discount_amount NUMERIC(10, 2),
    cart_discount_percentage NUMERIC(5, 2),
    cart_price_override NUMERIC(10, 2),
    total_amount NUMERIC(10, 2) NOT NULL,
    status public.order_status DEFAULT 'Received'::public.order_status,
    payment_status public.payment_status DEFAULT 'Unpaid'::public.payment_status,
    notes TEXT,
    is_express BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon users" ON public.orders FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Order Items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    has_color_identifier BOOLEAN DEFAULT false,
    color_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for anon users" ON public.order_items FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Inventory Items table
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    low_stock_threshold INTEGER,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Create Company Settings table
CREATE TABLE public.company_settings (
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users" ON public.company_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON public.company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Create Printer Settings table
CREATE TABLE public.printer_settings (
    id TEXT PRIMARY KEY,
    receipt_printer TEXT,
    customer_receipt_copies TEXT,
    stub_printer TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users" ON public.printer_settings FOR ALL TO anon USING (true) WITH CHECK (true);


-- Create Special Offers table
CREATE TABLE public.special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_identifier public.special_offer_type NOT NULL UNIQUE,
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
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated and anon users" ON public.special_offers FOR ALL USING (true) WITH CHECK (true);

-- create function to create order with items
CREATE OR REPLACE FUNCTION public.create_order_with_items_tx(
    p_customer_id uuid,
    p_customer_name text,
    p_subtotal_amount numeric,
    p_cart_discount_amount numeric,
    p_cart_discount_percentage numeric,
    p_cart_price_override numeric,
    p_total_amount numeric,
    p_status public.order_status,
    p_payment_status public.payment_status,
    p_notes text,
    p_is_express boolean,
    p_due_date timestamptz,
    p_items jsonb
) RETURNS SETOF public.orders AS $$
DECLARE
    new_order_id uuid;
    item_data jsonb;
BEGIN
    -- Insert the order
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount,
        cart_discount_percentage, cart_price_override, total_amount, status,
        payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount,
        p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status,
        p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING id INTO new_order_id;

    -- Insert order items from JSONB array
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
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

    -- Return the newly created order
    RETURN QUERY SELECT * FROM public.orders WHERE id = new_order_id;
END;
$$ LANGUAGE plpgsql;
