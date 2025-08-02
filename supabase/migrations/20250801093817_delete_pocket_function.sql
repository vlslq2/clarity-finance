CREATE OR REPLACE FUNCTION public.delete_pocket_and_reassign_transactions(
    pocket_id_to_delete bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_id uuid;
    v_pocket_to_delete public.pockets;
    v_new_default_pocket_id bigint;
BEGIN
    -- Get the user_id and details from the pocket being deleted
    SELECT * INTO v_pocket_to_delete FROM public.pockets WHERE id = pocket_id_to_delete;
    v_user_id := v_pocket_to_delete.user_id;

    -- If the pocket to be deleted is the default one
    IF v_pocket_to_delete.is_default THEN
        -- Find another pocket to set as the new default
        SELECT id INTO v_new_default_pocket_id 
        FROM public.pockets 
        WHERE user_id = v_user_id AND id != pocket_id_to_delete
        ORDER BY created_at
        LIMIT 1;

        -- If no other pocket is available, we can't delete the last one
        IF v_new_default_pocket_id IS NULL THEN
            RAISE EXCEPTION 'Cannot delete the last remaining pocket.';
        END IF;

        -- Update the new pocket to be the default
        UPDATE public.pockets 
        SET is_default = true 
        WHERE id = v_new_default_pocket_id;
    ELSE
        -- If we are not deleting the default pocket, we will reassign to the existing default
        SELECT id INTO v_new_default_pocket_id
        FROM public.pockets
        WHERE user_id = v_user_id AND is_default = true;

        -- This should ideally not happen if every user has a default pocket
        IF v_new_default_pocket_id IS NULL THEN
            RAISE EXCEPTION 'No default pocket found to reassign transactions to.';
        END IF;
    END IF;

    -- Re-assign transactions to the new default pocket
    UPDATE public.transactions
    SET pocket_id = v_new_default_pocket_id
    WHERE pocket_id = pocket_id_to_delete;

    -- Delete the now-empty pocket
    DELETE FROM public.pockets
    WHERE id = pocket_id_to_delete;
END;
$$;