-- Menu item availability toggle (admin can hide items without deleting)
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS menu_items_is_available_idx ON public.menu_items (is_available);
