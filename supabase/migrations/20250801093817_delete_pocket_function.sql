CREATE OR REPLACE FUNCTION public.delete_pocket_and_reassign_transactions(
    pocket_id_to_delete bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_default_pocket_id bigint;
BEGIN
    -- Get the user_id from the pocket being deleted
    SELECT user_id INTO v_user_id FROM public.pockets WHERE id = pocket_id_to_delete;

    -- Find the user's default pocket
    SELECT id INTO v_default_pocket_id FROM public.pockets WHERE user_id = v_user_id AND is_default = true;

    -- Ensure a default pocket exists
    IF v_default_pocket_id IS NULL THEN
        RAISE EXCEPTION 'No default pocket found for user.';
    END IF;

    -- Prevent deleting the default pocket itself
    IF pocket_id_to_delete = v_default_pocket_id THEN
        RAISE EXCEPTION 'Cannot delete the default pocket.';
    END IF;

    -- Re-assign transactions to the default pocket
    UPDATE public.transactions
    SET pocket_id = v_default_pocket_id
    WHERE pocket_id = pocket_id_to_delete;

    -- Delete the now-empty pocket
    DELETE FROM public.pockets
    WHERE id = pocket_id_to_delete;
END;
$$;