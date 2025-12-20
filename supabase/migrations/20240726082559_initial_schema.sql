
-- Initial Schema for XP Clean POS

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;


-- STORAGE --
-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for logo storage
DROP POLICY IF EXISTS "Allow authenticated users to upload logos" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "Allow public read access to logos" ON storage.objects;
CREATE POLICY "Allow public read access to logos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- POLICIES --

-- Policies for customers table
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON public.customers;
CREATE POLICY "Allow authenticated users to manage customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for orders table
DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON public.orders;
CREATE POLICY "Allow authenticated users to manage orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for order_items table
DROP POLICY IF EXISTS "Allow authenticated users to manage order items" ON public.order_items;
CREATE POLICY "Allow authenticated users to manage order items"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for inventory_items table
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON public.inventory_items;
CREATE POLICY "Allow authenticated users to manage inventory"
  ON public.inventory_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for staff table
DROP POLICY IF EXISTS "Allow authenticated users to manage staff" ON public.staff;
CREATE POLICY "Allow authenticated users to manage staff"
  ON public.staff
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for catalog_entries table
DROP POLICY IF EXISTS "Allow authenticated users to manage catalog" ON public.catalog_entries;
CREATE POLICY "Allow authenticated users to manage catalog"
  ON public.catalog_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for company_settings, printer_settings, special_offers
DROP POLICY IF EXISTS "Allow authenticated users to manage settings" ON public.company_settings;
CREATE POLICY "Allow authenticated users to manage settings"
  ON public.company_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage printer settings" ON public.printer_settings;
CREATE POLICY "Allow authenticated users to manage printer settings"
  ON public.printer_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage special offers" ON public.special_offers;
CREATE POLICY "Allow authenticated users to manage special offers"
  ON public.special_offers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- Create the transactional function for creating orders
-- This ensures that creating an order and its associated items is an atomic operation.
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
RETURNS SETOF public.orders AS $$
DECLARE
    new_order_id uuid;
    item jsonb;
BEGIN
    -- Insert the order header
    INSERT INTO public.orders (
        customer_id, customer_name, subtotal_amount, cart_discount_amount,
        cart_discount_percentage, cart_price_override, total_amount, status,
        payment_status, notes, is_express, due_date
    ) VALUES (
        p_customer_id, p_customer_name, p_subtotal_amount, p_cart_discount_amount,
        p_cart_discount_percentage, p_cart_price_override, p_total_amount, p_status,
        p_payment_status, p_notes, p_is_express, p_due_date
    ) RETURNING id INTO new_order_id;

    -- Loop through the items and insert them
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, service_item_id, service_name, quantity, unit_price,
            original_unit_price, item_discount_amount, item_discount_percentage,
            total_price, notes, has_color_identifier, color_value
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

    -- Return the newly created order header
    RETURN QUERY SELECT * FROM public.orders WHERE id = new_order_id;
END;
$$ LANGUAGE plpgsql;
