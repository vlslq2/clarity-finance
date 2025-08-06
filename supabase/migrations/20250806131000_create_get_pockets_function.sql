-- Create a dedicated function to fetch user-specific pockets.
-- This provides a more robust data access layer than direct table queries.

CREATE OR REPLACE FUNCTION public.get_pockets(p_user_id uuid)
RETURNS SETOF public.pockets -- Returns a set of rows matching the pockets table structure
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.pockets
  WHERE user_id = p_user_id;
$$;