-- This migration cleans up the budget category column by removing the old
-- incorrect `category_id` and renaming `category_uuid` to `category_id`.

-- Step 1: Drop the `get_budget_summaries` function as it will be recreated.
DROP FUNCTION IF EXISTS public.get_budget_summaries(p_user_id uuid);

-- Step 2: Drop the old `category_id` column of type `bigint`.
ALTER TABLE public.budgets DROP COLUMN IF EXISTS category_id;

-- Step 3: Rename the `category_uuid` column to `category_id`.
ALTER TABLE public.budgets RENAME COLUMN category_uuid TO category_id;

-- Step 4: Add a foreign key constraint on the new `category_id` column.
-- We drop it first to be safe, in case it was created with a different name.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id);

-- Step 5: Recreate the `get_budget_summaries` function to use the new `category_id`.
-- This version also fixes the return type of `id` to be `uuid`.
CREATE OR REPLACE FUNCTION get_budget_summaries(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    category_id uuid,
    amount numeric,
    period text,
    start_date date,
    is_active boolean,
    created_at timestamptz,
    spent_amount numeric,
    category_name text,
    category_icon text,
    category_color text,
    category_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_expenses AS (
        SELECT
            t.category_id,
            SUM(t.amount) AS total_spent
        FROM
            transactions t
        WHERE
            t.user_id = p_user_id AND
            t.type = 'expense' AND
            t.date >= date_trunc('month', CURRENT_DATE) AND
            t.date < date_trunc('month', CURRENT_DATE) + interval '1 month'
        GROUP BY
            t.category_id
    )
    SELECT
        b.id,
        b.user_id,
        b.category_id,
        b.amount,
        b.period,
        b.start_date,
        b.is_active,
        b.created_at,
        COALESCE(me.total_spent, 0) AS spent_amount,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COALESCE(c.icon, 'help-circle') AS category_icon,
        COALESCE(c.color, '#808080') AS category_color,
        COALESCE(c.type, 'expense') AS category_type
    FROM
        budgets b
    LEFT JOIN
        categories c ON b.category_id = c.id
    LEFT JOIN
        monthly_expenses me ON b.category_id = me.category_id
    WHERE
        b.user_id = p_user_id;
END;
$$;