-- Casa De Latte — Add CANCELLED to orders status check constraint
-- The customer-facing cancellation feature requires CANCELLED as a valid status.
-- This migration drops the existing constraint and recreates it with the full
-- allowlist: PENDING, ACCEPTED, PREPARING, READY, COMPLETED, REJECTED, CANCELLED.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED'));
