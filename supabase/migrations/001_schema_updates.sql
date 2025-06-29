-- supabase/migrations/001_schema_updates.sql
-- This script contains all the necessary schema changes for the new features.
-- You can run this entire file in your Supabase SQL Editor.

-- ========== 1. ALTER EXISTING TABLES ==========

-- Add role and active status to the staff table
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'clerk',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add new fields to the customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS loyalty_status TEXT,
  ADD COLUMN IF NOT EXISTS price_band TEXT,
  ADD COLUMN IF NOT EXISTS is_account_client BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_id TEXT,
  ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_preferred_pricing BOOLEAN DEFAULT false;

-- Add color identifier to the catalog_entries table
ALTER TABLE public.catalog_entries
  ADD COLUMN IF NOT EXISTS has_color_identifier BOOLEAN DEFAULT false;

-- Add discount and override fields to the orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cart_discount_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cart_discount_percentage NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS cart_price_override NUMERIC(10, 2);

-- Add discount and color fields to the order_items table
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS original_unit_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS item_discount_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS item_discount_percentage NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS has_color_identifier BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS color_value TEXT;


-- ========== 2. CREATE NEW TABLES ==========

-- Create the company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
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
  enable_platform_fee_pass_through BOOLEAN DEFAULT false,
  delivery_fee_base_gbp NUMERIC(10, 2),
  delivery_fee_per_mile_gbp NUMERIC(10, 2),
  delivery_fee_minimum_gbp NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Enable RLS for company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
-- Create policies for company_settings (example: allow authenticated users to read)
-- You may want to restrict write access to admins only.
CREATE POLICY "Allow authenticated read access to company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (true);


-- Create the printer_settings table
CREATE TABLE IF NOT EXISTS public.printer_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_printer_settings',
  receipt_printer TEXT,
  customer_receipt_copies TEXT,
  stub_printer TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
-- Enable RLS for printer_settings
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
-- Create policies for printer_settings
CREATE POLICY "Allow authenticated read access to printer settings"
ON public.printer_settings FOR SELECT
TO authenticated
USING (true);


-- Create the special_offers table
CREATE TABLE IF NOT EXISTS public.special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_type_identifier TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    notes TEXT,
    buy_x_items INT,
    pay_for_y_items INT,
    bundle_item_count INT,
    bundle_price NUMERIC(10, 2),
    spend_threshold NUMERIC(10, 2),
    free_item_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
-- Enable RLS for special_offers
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
-- Create policies for special_offers
CREATE POLICY "Allow authenticated read access to special offers"
ON public.special_offers FOR SELECT
TO authenticated
USING (true);

-- ========== 3. COMMENTS & NOTES ==========
COMMENT ON COLUMN public.staff.role IS 'User role, e.g., clerk, admin, super_admin';
COMMENT ON COLUMN public.staff.is_active IS 'Controls if the staff account can log in.';
COMMENT ON TABLE public.company_settings IS 'Stores global settings for the company, intended to have a single row.';
COMMENT ON TABLE public.printer_settings IS 'Stores global settings for printers, intended to have a single row.';
COMMENT ON TABLE public.special_offers IS 'Stores configurable special offers and promotions.';

-- Insert a default row for company_settings so it exists for updates.
INSERT INTO public.company_settings (id, company_name)
VALUES ('global_settings', 'XP Clean Ltd.')
ON CONFLICT (id) DO NOTHING;

-- Insert a default row for printer_settings.
INSERT INTO public.printer_settings (id, receipt_header, receipt_footer)
VALUES ('global_printer_settings', 'XP Clean - Your Town Branch', 'Thank you for your business!')
ON CONFLICT (id) DO NOTHING;
