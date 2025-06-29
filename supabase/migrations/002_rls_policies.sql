-- This script enables Row Level Security (RLS) for all tables and creates
-- policies to ensure the application continues to function correctly.
--
-- It defines two main access levels:
-- 1. AUTHENTICATED USERS (logged-in staff): Granted full access (SELECT, INSERT, UPDATE, DELETE) to all tables.
-- 2. ANONYMOUS USERS (public online portal): Granted read-only access (SELECT) to specific tables
--    required for the public-facing pages, such as the service catalog and company settings for scheduling.

-- =============================================
-- Step 1: Enable RLS for each table
-- =============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 2: Drop existing default policies if they exist, to prevent conflicts.
-- The 'if exists' clause prevents errors if the policy isn't there.
-- =============================================
DROP POLICY IF EXISTS "Allow public read access" ON public.customers;
DROP POLICY IF EXISTS "Allow individual access" ON public.customers;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.customers;

DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.inventory_items;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.catalog_entries;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.catalog_entries;

DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.staff;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.company_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.company_settings;

DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.printer_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.special_offers;


-- =============================================
-- Step 3: Create policies for AUTHENTICATED users
-- Role: 'authenticated'
-- Grants full permissions on all tables.
-- =============================================

CREATE POLICY "Allow full access for authenticated users"
ON public.customers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.orders FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.inventory_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.catalog_entries FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.staff FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.company_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.printer_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access for authenticated users"
ON public.special_offers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- =============================================
-- Step 4: Create policies for ANONYMOUS users
-- Role: 'anon'
-- Grants read-only access to tables needed for the public online ordering portal.
-- =============================================

-- Policy for catalog_entries: Allows anonymous users to see the service list.
CREATE POLICY "Allow anonymous read access"
ON public.catalog_entries FOR SELECT
TO anon
USING (true);

-- Policy for company_settings: Allows anonymous users to see scheduling info.
CREATE POLICY "Allow anonymous read access"
ON public.company_settings FOR SELECT
TO anon
USING (true);

-- Note: Anonymous users do NOT get access to customers, orders, staff, etc.
-- RLS will correctly block any attempts to read from those tables.

-- =============================================
-- Finished. Your tables are now protected by RLS.
-- =============================================
