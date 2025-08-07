-- Add the missing foreign key relationship between recurring_transactions and categories.
-- This resolves the PGRST200 error that was preventing data from loading.

ALTER TABLE public.recurring_transactions
ADD CONSTRAINT recurring_transactions_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.categories (id)
ON DELETE SET NULL;