-- Casa De Latte — Set REPLICA IDENTITY FULL on the orders table
--
-- Root cause: without REPLICA IDENTITY FULL, Supabase Realtime UPDATE events
-- only include the primary key (id) in payload.new. All other columns — including
-- status — are absent. This means customer-initiated status changes (e.g.
-- CANCELLED) are broadcast by the database but arrive at the admin dashboard
-- with no status field, so the client-side merge leaves the order unchanged.
--
-- Setting REPLICA IDENTITY FULL causes PostgreSQL to include every column in
-- the logical replication UPDATE message, so payload.new.status is always
-- present and the admin dashboard updates immediately without a full refetch.
--
-- This is the standard Supabase recommendation for tables used with Realtime.
-- See: https://supabase.com/docs/guides/realtime/postgres-changes#replica-identity

ALTER TABLE public.orders REPLICA IDENTITY FULL;
