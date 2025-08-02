-- Drop the old function to ensure a clean slate
DROP FUNCTION IF EXISTS public.update_pocket_balance(bigint, numeric);

-- Create the final, corrected function
CREATE OR REPLACE FUNCTION public.update_pocket_balance(
    pocket_id_to_update bigint,
    amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
-- Run the function with the permissions of the user who calls it
SECURITY INVOKER
-- Set a secure search path to prevent hijacking
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify that the user calling the function owns the pocket they are trying to update
    SELECT user_id INTO v_user_id
    FROM public.pockets
    WHERE id = pocket_id_to_update;

    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Pocket not found or you are not authorized to update it.';
    END IF;

    -- If ownership is confirmed, proceed with the update
    UPDATE public.pockets
    SET balance = balance + amount_change
    WHERE id = pocket_id_to_update;
END;
$$;