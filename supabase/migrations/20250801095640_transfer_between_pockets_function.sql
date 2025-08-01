CREATE OR REPLACE FUNCTION public.transfer_between_pockets(
    amount numeric,
    from_pocket_id bigint,
    to_pocket_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_transfer_category_id bigint;
BEGIN
    -- Ensure the user owns both pockets
    IF NOT EXISTS (SELECT 1 FROM public.pockets WHERE id = from_pocket_id AND user_id = v_user_id) OR
       NOT EXISTS (SELECT 1 FROM public.pockets WHERE id = to_pocket_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'User does not own one or both pockets.';
    END IF;

    -- Find or create a "Transfer" category for the user
    SELECT id INTO v_transfer_category_id FROM public.categories 
    WHERE user_id = v_user_id AND name = 'Transfer';

    IF v_transfer_category_id IS NULL THEN
        INSERT INTO public.categories (user_id, name, icon, color, type)
        VALUES (v_user_id, 'Transfer', 'repeat', '#64748b', 'expense')
        RETURNING id INTO v_transfer_category_id;
    END IF;

    -- Create the expense transaction
    INSERT INTO public.transactions (user_id, amount, description, category_id, pocket_id, type, date)
    VALUES (v_user_id, amount, 'Transfer to another pocket', v_transfer_category_id, from_pocket_id, 'expense', NOW());

    -- Create the income transaction
    INSERT INTO public.transactions (user_id, amount, description, category_id, pocket_id, type, date)
    VALUES (v_user_id, amount, 'Transfer from another pocket', v_transfer_category_id, to_pocket_id, 'income', NOW());

    -- Update balances
    PERFORM public.update_pocket_balance(from_pocket_id, -amount);
    PERFORM public.update_pocket_balance(to_pocket_id, amount);
END;
$$;