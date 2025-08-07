-- This migration corrects the logic in the transaction trigger to prevent double-counting on updates.

-- Step 1: Drop the old, incorrect trigger and function.
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP FUNCTION IF EXISTS public.handle_transaction_change();

-- Step 2: Recreate the function with the corrected update logic.
CREATE OR REPLACE FUNCTION public.handle_transaction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  amount_diff numeric;
BEGIN
  -- If a transaction is inserted
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.pockets
    SET balance = balance + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
    WHERE id = NEW.pocket_id;

  -- If a transaction is deleted
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.pockets
    SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
    WHERE id = OLD.pocket_id;

  -- If a transaction is updated
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If the pocket has not changed
    IF OLD.pocket_id = NEW.pocket_id THEN
      -- Calculate the difference and apply it
      amount_diff := (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END) - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END);
      UPDATE public.pockets
      SET balance = balance + amount_diff
      WHERE id = NEW.pocket_id;
    -- If the pocket has changed
    ELSE
      -- Revert the old transaction from the old pocket
      UPDATE public.pockets
      SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
      WHERE id = OLD.pocket_id;
      -- Apply the new transaction to the new pocket
      UPDATE public.pockets
      SET balance = balance + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
      WHERE id = NEW.pocket_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Step 3: Recreate the trigger.
CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_change();