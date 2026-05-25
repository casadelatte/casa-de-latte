-- Roast profile customization + customer mobile on orders
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS requires_roast_profile BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS mobile_number TEXT NOT NULL DEFAULT '';
