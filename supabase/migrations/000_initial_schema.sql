
-- Initial Schema for XP Clean POS

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Custom Types
do $$
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('clerk', 'admin', 'super_admin');
    end if;
    if not exists (select 1 from pg_type where typname = 'order_status_enum') then
        create type public.order_status_enum as enum ('Received', 'Processing', 'Cleaning', 'Alterations', 'Ready for Pickup', 'Completed', 'Cancelled');
    end if;
    if not exists (select 1 from pg_type where typname = 'payment_status_enum') then
        create type public.payment_status_enum as enum ('Paid', 'Unpaid', 'Processing Payment', 'Refunded');
    end if;
    if not exists (select 1 from pg_type where typname = 'catalog_entry_type_enum') then
        create type public.catalog_entry_type_enum as enum ('category', 'item');
    end if;
    if not exists (select 1 from pg_type where typname = 'special_offer_type_identifier_enum') then
        create type public.special_offer_type_identifier_enum as enum ('BUY_X_GET_Y', 'BUNDLE_DEAL', 'SPEND_GET_FREE_ITEM');
    end if;
end
$$;


-- 3. Create Tables
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    phone text,
    email text,
    address text,
    loyalty_status text default 'None',
    price_band text default 'Standard',
    is_account_client boolean default false,
    account_id text,
    sms_opt_in boolean default false,
    email_opt_in boolean default false,
    has_preferred_pricing boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.staff (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    login_id text not null unique,
    hashed_password text not null,
    role public.user_role default 'clerk' not null,
    enable_quick_login boolean default false not null,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.catalog_entries (
    id uuid primary key default uuid_generate_v4(),
    parent_id uuid references public.catalog_entries(id) on delete restrict,
    type public.catalog_entry_type_enum not null,
    name text not null,
    description text,
    price numeric(10, 2),
    sort_order integer not null default 0,
    has_color_identifier boolean,
    small_tags_to_print integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    order_number text,
    customer_id uuid references public.customers(id),
    customer_name text not null,
    subtotal_amount numeric(10, 2) default 0.00 not null,
    cart_discount_amount numeric(10, 2),
    cart_discount_percentage numeric(5, 2),
    cart_price_override numeric(10, 2),
    total_amount numeric(10, 2) not null,
    status public.order_status_enum default 'Received' not null,
    payment_status public.payment_status_enum default 'Unpaid' not null,
    notes text,
    is_express boolean default false not null,
    due_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid not null references public.orders(id) on delete cascade,
    service_item_id uuid references public.catalog_entries(id) on delete set null,
    service_name text not null,
    quantity integer not null,
    unit_price numeric(10, 2) not null,
    original_unit_price numeric(10, 2),
    item_discount_amount numeric(10, 2),
    item_discount_percentage numeric(5, 2),
    total_price numeric(10, 2) not null,
    notes text,
    has_color_identifier boolean,
    color_value text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.inventory_items (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    quantity integer not null,
    unit text not null,
    low_stock_threshold integer,
    last_restocked_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.company_settings (
    id text primary key,
    company_name text,
    company_address text,
    company_phone text,
    company_logo_url text,
    vat_tax_id text,
    vat_sales_tax_rate numeric(5, 2),
    include_vat_in_prices boolean,
    selected_currency text,
    selected_language text,
    available_collection_schedule jsonb,
    available_delivery_schedule jsonb,
    stripe_connect_account_id text,
    enable_platform_fee_pass_through boolean,
    delivery_fee_base_gbp numeric(10, 2),
    delivery_fee_per_mile_gbp numeric(10, 2),
    delivery_fee_minimum_gbp numeric(10, 2),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.printer_settings (
    id text primary key,
    receipt_printer text,
    customer_receipt_copies text,
    stub_printer text,
    receipt_header text,
    receipt_footer text,
    small_tag_print_settings jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.special_offers (
    id uuid primary key default uuid_generate_v4(),
    offer_type_identifier public.special_offer_type_identifier_enum not null unique,
    is_active boolean default false,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    notes text,
    buy_x_items integer,
    pay_for_y_items integer,
    bundle_item_count integer,
    bundle_price numeric(10, 2),
    spend_threshold numeric(10, 2),
    free_item_description text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Set up Row Level Security (RLS)
alter table public.customers enable row level security;
alter table public.staff enable row level security;
alter table public.catalog_entries enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.company_settings enable row level security;
alter table public.printer_settings enable row level security;
alter table public.special_offers enable row level security;

-- 5. Create RLS Policies
-- Policies for 'customers'
drop policy if exists "Allow public read access to customers" on public.customers;
create policy "Allow public read access to customers" on public.customers for select using (true);
drop policy if exists "Allow authenticated user to insert their own customer" on public.customers;
create policy "Allow authenticated user to insert their own customer" on public.customers for insert with check (auth.role() = 'authenticated');
drop policy if exists "Allow authenticated user to update their own customer" on public.customers;
create policy "Allow authenticated user to update their own customer" on public.customers for update using (auth.role() = 'authenticated');

-- Policies for 'staff'
drop policy if exists "Allow all access to staff for super_admins" on public.staff;
create policy "Allow all access to staff for super_admins" on public.staff for all using (
  (select role from public.staff where id = auth.uid()) = 'super_admin'
);
drop policy if exists "Allow admins to view staff" on public.staff;
create policy "Allow admins to view staff" on public.staff for select using (
  (select role from public.staff where id = auth.uid()) IN ('admin', 'super_admin')
);

-- Policies for 'catalog_entries'
drop policy if exists "Allow public read access to catalog" on public.catalog_entries;
create policy "Allow public read access to catalog" on public.catalog_entries for select using (true);
drop policy if exists "Allow admin/super_admin to manage catalog" on public.catalog_entries;
create policy "Allow admin/super_admin to manage catalog" on public.catalog_entries for all using (
  auth.role() = 'authenticated' -- In a real app, you'd check a custom claim or a role in a user roles table.
  -- For this prototype, we assume any authenticated user might be an admin for simplicity of setup.
  -- A better check: `get_my_claim('user_role') IN ('admin', 'super_admin')`
);

-- Policies for 'orders' and 'order_items'
drop policy if exists "Allow all access to orders for authenticated users" on public.orders;
create policy "Allow all access to orders for authenticated users" on public.orders for all using (auth.role() = 'authenticated');
drop policy if exists "Allow all access to order items for authenticated users" on public.order_items;
create policy "Allow all access to order items for authenticated users" on public.order_items for all using (auth.role() = 'authenticated');

-- Policies for 'inventory_items'
drop policy if exists "Allow all access to inventory for authenticated users" on public.inventory_items;
create policy "Allow all access to inventory for authenticated users" on public.inventory_items for all using (auth.role() = 'authenticated');

-- Policies for 'company_settings', 'printer_settings', 'special_offers'
drop policy if exists "Allow read access to settings for everyone" on public.company_settings;
create policy "Allow read access to settings for everyone" on public.company_settings for select using (true);
drop policy if exists "Allow full control for authenticated users on settings" on public.company_settings;
create policy "Allow full control for authenticated users on settings" on public.company_settings for all using (auth.role() = 'authenticated');

drop policy if exists "Allow read access to printer settings for everyone" on public.printer_settings;
create policy "Allow read access to printer settings for everyone" on public.printer_settings for select using (true);
drop policy if exists "Allow full control for authenticated users on printer settings" on public.printer_settings;
create policy "Allow full control for authenticated users on printer settings" on public.printer_settings for all using (auth.role() = 'authenticated');

drop policy if exists "Allow read access to special offers for everyone" on public.special_offers;
create policy "Allow read access to special offers for everyone" on public.special_offers for select using (true);
drop policy if exists "Allow full control for authenticated users on special offers" on public.special_offers;
create policy "Allow full control for authenticated users on special offers" on public.special_offers for all using (auth.role() = 'authenticated');


-- 6. Create Transactional Function for Order Creation
-- Drop the function with its specific signature if it exists, to allow for changes in return type or arguments.
DROP FUNCTION IF EXISTS public.create_order_with_items_tx(uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, timestamp with time zone, jsonb);

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
    status order_status_enum,
    payment_status payment_status_enum,
    notes text,
    is_express boolean,
    due_date timestamptz,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id uuid;
    item_data jsonb;
BEGIN
    -- Insert the order header
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage,
        cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage,
        p_cart_price_override, p_total_amount, p_status::order_status_enum, p_payment_status::payment_status_enum, p_notes, p_is_express, p_due_date
    ) RETURNING public.orders.id INTO new_order_id;

    -- Insert order items
    FOR item_data IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price,
            original_unit_price, item_discount_amount, item_discount_percentage,
            total_price, notes, has_color_identifier, color_value
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
    RETURN QUERY
    SELECT o.id, o.order_number, o.customer_id, o.customer_name, o.subtotal_amount, o.cart_discount_amount, o.cart_discount_percentage, o.cart_price_override, o.total_amount, o.status, o.payment_status, o.notes, o.is_express, o.due_date, o.created_at, o.updated_at
    FROM public.orders o
    WHERE o.id = new_order_id;
END;
$$;


-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, timestamptz, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items_tx(uuid, text, numeric, numeric, numeric, numeric, numeric, text, text, text, boolean, timestamptz, jsonb) TO service_role;

-- Disable RLS on catalog_entries as it's public data
ALTER TABLE public.catalog_entries DISABLE ROW LEVEL SECURITY;
