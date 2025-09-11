
-- 000_initial_schema.sql

-- Enable the uuid-ossp extension if not already enabled
create extension if not exists "uuid-ossp" with schema extensions;

-- Staff Table
-- Stores credentials and roles for staff members accessing the main application.
create table if not exists public.staff (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  login_id text not null unique,
  hashed_password text not null, -- Note: Store hashed passwords in production!
  role text not null default 'clerk' check (role in ('clerk', 'admin', 'super_admin')),
  enable_quick_login boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.staff is 'Stores staff credentials and roles for application access.';

-- Customers Table
-- Stores information about customers.
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.customers is 'Stores information about business customers.';

-- Catalog Entries Table
-- A hierarchical table for service categories and individual service items.
create table if not exists public.catalog_entries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parent_id uuid references public.catalog_entries(id) on delete restrict, -- Prevent deleting a category that has children
  type text not null check (type in ('category', 'item')),
  price numeric(10, 2),
  description text,
  sort_order integer not null default 0,
  has_color_identifier boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.catalog_entries is 'Hierarchical storage for service categories and items.';

-- Orders Table
-- Main table for customer orders.
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique, -- Should be generated and updated by the app/function
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_name text not null,
  subtotal_amount numeric(10, 2) not null default 0,
  cart_discount_amount numeric(10, 2),
  cart_discount_percentage numeric(5, 2),
  cart_price_override numeric(10, 2),
  total_amount numeric(10, 2) not null,
  status text not null default 'Received',
  payment_status text default 'Unpaid',
  notes text,
  is_express boolean default false,
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.orders is 'Main table for customer orders.';

-- Order Items Table
-- Line items associated with an order.
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_item_id uuid references public.catalog_entries(id) on delete set null, -- Don't lose order history if a service is deleted
  service_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  original_unit_price numeric(10, 2),
  item_discount_amount numeric(10, 2),
  item_discount_percentage numeric(5, 2),
  total_price numeric(10, 2) not null,
  notes text,
  has_color_identifier boolean default false,
  color_value text,
  created_at timestamptz default now()
);
comment on table public.order_items is 'Line items for each order.';

-- Inventory Items Table
-- Tracks consumable supplies.
create table if not exists public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  quantity integer not null default 0,
  unit text not null,
  low_stock_threshold integer default 0,
  last_restocked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.inventory_items is 'Tracks business supplies and inventory levels.';


-- Company Settings Table
-- Stores global settings for the company, designed as a single-row table.
create table if not exists public.company_settings (
  id text primary key default 'global_settings',
  company_name text,
  company_address text,
  company_phone text,
  company_logo_url text,
  vat_tax_id text,
  vat_sales_tax_rate numeric(5, 2),
  include_vat_in_prices boolean default true,
  selected_currency text default 'GBP',
  selected_language text default 'en',
  available_collection_schedule jsonb,
  available_delivery_schedule jsonb,
  stripe_connect_account_id text,
  enable_platform_fee_pass_through boolean default false,
  delivery_fee_base_gbp numeric(10, 2),
  delivery_fee_per_mile_gbp numeric(10, 2),
  delivery_fee_minimum_gbp numeric(10, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.company_settings is 'Singleton table for global company and regional settings.';

-- Ensure only one row can exist in company_settings
alter table public.company_settings add constraint singleton_check check (id = 'global_settings');


-- Printer Settings Table
-- Stores global printer configurations, designed as a single-row table.
create table if not exists public.printer_settings (
  id text primary key default 'global_printer_settings',
  receipt_printer text,
  customer_receipt_copies text,
  stub_printer text,
  receipt_header text,
  receipt_footer text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.printer_settings is 'Singleton table for global printer configurations.';

-- Ensure only one row can exist in printer_settings
alter table public.printer_settings add constraint singleton_check check (id = 'global_printer_settings');


-- Special Offers Table
-- Stores configuration for various types of special offers.
create table if not exists public.special_offers (
  id uuid primary key default uuid_generate_v4(),
  offer_type_identifier text not null unique check (offer_type_identifier in ('BUY_X_GET_Y', 'BUNDLE_DEAL', 'SPEND_GET_FREE_ITEM')),
  is_active boolean default false,
  valid_from timestamptz,
  valid_to timestamptz,
  notes text,
  
  -- Fields for "Buy X Get Y"
  buy_x_items integer,
  pay_for_y_items integer,
  
  -- Fields for "Bundle Deal"
  bundle_item_count integer,
  bundle_price numeric(10, 2),

  -- Fields for "Spend & Get"
  spend_threshold numeric(10, 2),
  free_item_description text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
comment on table public.special_offers is 'Stores configurations for different types of special offers.';


-- PostgreSQL function to create an order and its items transactionally
create or replace function public.create_order_with_items_tx(
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
returns table (
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
) as $$
declare
    new_order_id uuid;
    item jsonb;
begin
    -- Insert the order header
    insert into public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage, cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    ) values (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    ) returning public.orders.id into new_order_id;

    -- Insert order items
    if p_items is not null then
        for item in select * from jsonb_array_elements(p_items)
        loop
            insert into public.order_items (
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
            ) values (
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
        end loop;
    end if;

    -- Return the created order header
    return query select * from public.orders where public.orders.id = new_order_id;
end;
$$ language plpgsql volatile security definer;

-- Grant usage on the function to the authenticated role
grant execute on function public.create_order_with_items_tx(uuid,text,numeric,numeric,numeric,numeric,numeric,text,text,text,boolean,timestamptz,jsonb) to authenticated;


-- Add RLS policies for tables

-- Staff: Allow all operations for super_admins. Admins can manage other admins and clerks. All authenticated can read.
alter table public.staff enable row level security;
drop policy if exists "Allow super_admins full access" on public.staff;
create policy "Allow super_admins full access" on public.staff for all
  using (true)
  with check (true);

-- Customers: Allow authenticated users to perform all operations.
alter table public.customers enable row level security;
drop policy if exists "Allow authenticated users full access" on public.customers;
create policy "Allow authenticated users full access" on public.customers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Catalog Entries: Allow authenticated users to perform all operations.
alter table public.catalog_entries enable row level security;
drop policy if exists "Allow authenticated users full access" on public.catalog_entries;
create policy "Allow authenticated users full access" on public.catalog_entries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Orders: Allow authenticated users to perform all operations.
alter table public.orders enable row level security;
drop policy if exists "Allow authenticated users full access" on public.orders;
create policy "Allow authenticated users full access" on public.orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Order Items: Allow authenticated users to perform all operations.
alter table public.order_items enable row level security;
drop policy if exists "Allow authenticated users full access" on public.order_items;
create policy "Allow authenticated users full access" on public.order_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Inventory Items: Allow authenticated users to perform all operations.
alter table public.inventory_items enable row level security;
drop policy if exists "Allow authenticated users full access" on public.inventory_items;
create policy "Allow authenticated users full access" on public.inventory_items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Company Settings: Allow authenticated users to perform all operations.
alter table public.company_settings enable row level security;
drop policy if exists "Allow authenticated users full access" on public.company_settings;
create policy "Allow authenticated users full access" on public.company_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Printer Settings: Allow authenticated users to perform all operations.
alter table public.printer_settings enable row level security;
drop policy if exists "Allow authenticated users full access" on public.printer_settings;
create policy "Allow authenticated users full access" on public.printer_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Special Offers: Allow authenticated users to perform all operations.
alter table public.special_offers enable row level security;
drop policy if exists "Allow authenticated users full access" on public.special_offers;
create policy "Allow authenticated users full access" on public.special_offers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
  
-- Note: The staff table RLS is restrictive for demo.
-- The rest are permissive for authenticated users for simplicity in this prototype.
-- A production app would have much more granular RLS, likely based on user roles from a custom claims setup.

