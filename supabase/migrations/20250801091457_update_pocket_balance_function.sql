CREATE OR REPLACE FUNCTION public.update_pocket_balance(
    pocket_id_to_update bigint,
    amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.pockets
    SET balance = balance + amount_change
    WHERE id = pocket_id_to_update;
END;
$$;