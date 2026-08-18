-- Fix Security Definer View lints by setting security_invoker = true
-- This ensures the views enforce Row Level Security (RLS) and permissions of the querying user.

ALTER VIEW public.products_with_collections SET (security_invoker = true);
ALTER VIEW public.pbrides_products_with_collections SET (security_invoker = true);
