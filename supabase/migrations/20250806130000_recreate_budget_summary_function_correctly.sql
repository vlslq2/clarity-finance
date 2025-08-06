-- Final fix for the budget summary function, ensuring correct data types for joins.

-- Step 1: Drop the old, incorrect function if it exists.
DROP FUNCTION IF EXISTS public.get_budget_summaries(p_user_id uuid);

-- Step 2: Recreate the function with the correct join logic and return types.
CREATE OR REPLACE FUNCTION public.get_budget_summaries(p_user_id uuid)
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
            public.transactions t
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
        public.budgets b
    LEFT JOIN
        public.categories c ON b.category_id = c.id -- Correct: uuid = uuid
    LEFT JOIN
        monthly_expenses me ON b.category_id = me.category_id -- Correct: uuid = uuid
    WHERE
        b.user_id = p_user_id;
END;
$$;