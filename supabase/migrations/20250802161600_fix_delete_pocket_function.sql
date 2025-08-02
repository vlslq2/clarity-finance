-- Drop the old function to ensure a clean slate
DROP FUNCTION IF EXISTS public.delete_pocket_and_reassign_transactions(bigint);

-- Create the final, corrected function
CREATE OR REPLACE FUNCTION public.delete_pocket_and_reassign_transactions(
    pocket_id_to_delete bigint
)
RETURNS void
LANGUAGE plpgsql
-- Run the function with the permissions of the user who calls it
SECURITY INVOKER
-- Set a secure search path to prevent hijacking, fixing the warning from your screenshot
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    default_pocket_id bigint;
BEGIN
    -- Find the pocket to be deleted and verify ownership
    SELECT user_id INTO v_user_id
    FROM public.pockets
    WHERE id = pocket_id_to_delete;

    -- Verify that the user calling the function owns this pocket
    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Pocket not found or you are not authorized to delete it.';
    END IF;

    -- Find the user's default pocket to reassign transactions to
    SELECT id INTO default_pocket_id
    FROM public.pockets
    WHERE user_id = v_user_id AND is_default = true;

    -- Ensure a default pocket exists
    IF default_pocket_id IS NULL THEN
        RAISE EXCEPTION 'No default pocket found to reassign transactions to.';
    END IF;

    -- Prevent the user from deleting their default pocket
    IF pocket_id_to_delete = default_pocket_id THEN
        RAISE EXCEPTION 'You cannot delete your default pocket.';
    END IF;

    -- Re-assign all transactions from the deleted pocket to the default pocket.
    -- The RLS policy on the 'transactions' table allows this update.
    UPDATE public.transactions
    SET pocket_id = default_pocket_id
    WHERE pocket_id = pocket_id_to_delete;

    -- Finally, delete the pocket.
    -- The RLS policy on the 'pockets' table allows this deletion.
    DELETE FROM public.pockets
    WHERE id = pocket_id_to_delete;
END;
$$;