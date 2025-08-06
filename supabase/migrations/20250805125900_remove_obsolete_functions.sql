-- This migration removes obsolete functions that are no longer needed
-- and are causing security warnings. Their logic has been superseded
-- by the handle_new_user trigger defined in a later migration.

DROP FUNCTION IF EXISTS public.create_default_categories(user_id uuid);
DROP FUNCTION IF EXISTS public.create_default_preferences(user_id uuid);