-- This migration removes old, conflicting RLS policies that were causing
-- "Multiple Permissive Policies" and "Auth RLS Initialization Plan" warnings.

-- Drop conflicting policies for the 'pockets' table
DROP POLICY IF EXISTS "Enable delete for own pockets" ON public.pockets;
DROP POLICY IF EXISTS "Enable update for own pockets" ON public.pockets;
DROP POLICY IF EXISTS "Enable insert for own pockets" ON public.pockets;
DROP POLICY IF EXISTS "Enable read access for own pockets" ON public.pockets;

-- Drop conflicting policies for the 'transactions' table
DROP POLICY IF EXISTS "Enable delete for own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for own transactions" ON public.transactions;

-- Drop the temporary debugging function as it is no longer needed
DROP FUNCTION IF EXISTS public.debug_get_policies();