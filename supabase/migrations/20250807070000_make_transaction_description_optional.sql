-- This migration makes the description column on the transactions table optional.

ALTER TABLE public.transactions
ALTER COLUMN description DROP NOT NULL;