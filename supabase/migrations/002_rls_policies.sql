-- This script enables Row Level Security (RLS) for all tables and creates
-- policies to ensure the application continues to function correctly.
--
-- It defines access for:
-- 1. AUTHENTICATED & ANONYMOUS USERS: Given the prototype nature and custom staff auth,
--    we grant access to both roles for the POS functionality.

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
-- Step 2: Drop existing default policies if they exist.
-- =============================================
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.catalog_entries;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.company_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.printer_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.special_offers;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.catalog_entries;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.company_settings;


-- =============================================
-- Step 3: Create policies for ALL users (authenticated and anon)
-- To support the custom staff authentication and prototype workflow.
-- =============================================

CREATE POLICY "Allow full access"
ON public.customers FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.orders FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.order_items FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.inventory_items FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.catalog_entries FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.staff FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.company_settings FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.printer_settings FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow full access"
ON public.special_offers FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- =============================================
-- Finished. Your tables are now accessible.
-- =============================================
