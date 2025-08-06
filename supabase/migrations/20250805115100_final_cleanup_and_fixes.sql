-- This migration cleans up remaining security warnings.

-- 1. Fix the search path for the current_user_id function.
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid()
$$;

-- 2. Drop orphaned functions that are no longer used.
-- The logic for these is now handled by the `handle_new_user` trigger.
DROP FUNCTION IF EXISTS public.create_default_categories();
DROP FUNCTION IF EXISTS public.create_default_preferences();