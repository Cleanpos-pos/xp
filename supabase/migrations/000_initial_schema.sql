
-- Create users table (if you need custom user profiles beyond auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb
);
-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Create customers table
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
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
-- RLS for customers table
alter table public.customers enable row level security;
create policy "Customers are viewable by authenticated users." on public.customers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert customers." on public.customers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update customers." on public.customers for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete customers." on public.customers for delete using (auth.role() = 'authenticated');

-- Create catalog_entries table
create table if not exists public.catalog_entries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.catalog_entries(id) on delete restrict, -- Prevent deleting a category that has children
  type text not null, -- 'category' or 'item'
  price numeric(10, 2), -- For items
  description text,
  has_color_identifier boolean default false,
  small_tags_to_print int default 1,
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for catalog_entries table (publicly readable)
alter table public.catalog_entries enable row level security;
create policy "Catalog entries are viewable by everyone." on public.catalog_entries for select using (true);
create policy "Authenticated users can manage catalog entries." on public.catalog_entries for all using (auth.role() = 'authenticated');


-- Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique, -- Consider a sequence or a function to generate this
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text, -- Denormalized for quick access
  subtotal_amount numeric(10, 2) default 0,
  cart_discount_amount numeric(10, 2),
  cart_discount_percentage numeric(5,2),
  cart_price_override numeric(10, 2),
  total_amount numeric(10, 2) not null,
  status text not null default 'Received',
  payment_status text not null default 'Unpaid',
  notes text,
  is_express boolean default false,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for orders table
alter table public.orders enable row level security;
create policy "Orders are accessible by authenticated users." on public.orders for all using (auth.role() = 'authenticated');


-- Create order_items table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  service_item_id uuid references public.catalog_entries(id) on delete set null, -- Link to catalog
  service_name text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  original_unit_price numeric(10, 2),
  item_discount_amount numeric(10, 2),
  item_discount_percentage numeric(5, 2),
  total_price numeric(10, 2) not null,
  notes text,
  has_color_identifier boolean default false,
  color_value text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for order_items table
alter table public.order_items enable row level security;
create policy "Order items are accessible by authenticated users." on public.order_items for all using (auth.role() = 'authenticated');


-- Create inventory_items table
create table if not exists public.inventory_items (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    quantity integer not null default 0,
    unit text not null,
    low_stock_threshold integer default 0,
    last_restocked_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for inventory_items table
alter table public.inventory_items enable row level security;
create policy "Inventory items are accessible by authenticated users." on public.inventory_items for all using (auth.role() = 'authenticated');


-- Create staff table
create table if not exists public.staff (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  login_id text not null unique,
  hashed_password text not null, -- NOTE: For prototype, this will be plain text. HASH IN PRODUCTION!
  role text not null default 'clerk', -- 'clerk', 'admin', 'super_admin'
  enable_quick_login boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for staff table - ONLY service_role can access this! Be very careful.
alter table public.staff enable row level security;
create policy "Staff information is protected." on public.staff for all using (false); -- Deny all access by default
-- Policies for a service_role or specific admin roles would be needed in a real scenario.
-- For this prototype, we'll manage staff via server-side actions using the service_role key.

-- Create Company Settings table (singleton table)
create table if not exists public.company_settings (
  id text primary key default 'global_settings',
  company_name text,
  company_address text,
  company_phone text,
  company_logo_url text,
  vat_tax_id text,
  vat_sales_tax_rate numeric(5, 2) default 0.00,
  include_vat_in_prices boolean default true,
  selected_currency text default 'GBP',
  selected_language text default 'en',
  available_collection_schedule jsonb,
  available_delivery_schedule jsonb,
  stripe_connect_account_id text,
  enable_platform_fee_pass_through boolean default false,
  delivery_fee_base_gbp numeric(10, 2) default 0.00,
  delivery_fee_per_mile_gbp numeric(10, 2) default 0.00,
  delivery_fee_minimum_gbp numeric(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for company_settings table
alter table public.company_settings enable row level security;
create policy "Company settings are viewable by everyone." on public.company_settings for select using (true);
create policy "Company settings can be managed by authenticated users." on public.company_settings for all using (auth.role() = 'authenticated');


-- Create Printer Settings table (singleton table)
create table if not exists public.printer_settings (
  id text primary key default 'global_printer_settings',
  receipt_printer text default 'thermal_80mm',
  customer_receipt_copies text default '1',
  stub_printer text default 'dotmatrix_76mm',
  receipt_header text,
  receipt_footer text,
  small_tag_print_settings jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for printer_settings table
alter table public.printer_settings enable row level security;
create policy "Printer settings are viewable by everyone." on public.printer_settings for select using (true);
create policy "Printer settings can be managed by authenticated users." on public.printer_settings for all using (auth.role() = 'authenticated');

-- Create Special Offers table
create table if not exists public.special_offers (
    id uuid default gen_random_uuid() primary key,
    offer_type_identifier text not null unique, -- e.g., 'BUY_X_GET_Y', 'BUNDLE_DEAL'
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
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS for special_offers table
alter table public.special_offers enable row level security;
create policy "Special offers are viewable by everyone." on public.special_offers for select using (true);
create policy "Authenticated users can manage special offers." on public.special_offers for all using (auth.role() = 'authenticated');


-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function for transactional order creation
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
    p_due_date timestamp with time zone,
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
    due_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
language plpgsql
as $$
declare
    v_order_id uuid;
    item_data jsonb;
begin
    -- Insert the order header
    insert into public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount, cart_discount_percentage,
        cart_price_override, total_amount, status, payment_status, notes, is_express, due_date
    )
    values (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount, p_cart_discount_percentage,
        p_cart_price_override, p_total_amount, p_status, p_payment_status, p_notes, p_is_express, p_due_date
    )
    returning public.orders.id into v_order_id;

    -- Loop through the items and insert them
    for item_data in select * from jsonb_array_elements(p_items)
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
        )
        values (
            v_order_id,
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
    end loop;

    -- Return the newly created order header
    return query select * from public.orders where public.orders.id = v_order_id;
end;
$$;

-- Set up storage
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Logo images are publicly accessible."
on storage.objects for select
using ( bucket_id = 'logos' );

create policy "Anyone can upload a logo."
on storage.objects for insert
with check ( bucket_id = 'logos' );
