-- This migration fixes the budget display and reset logic by updating the get_budget_summaries function.
-- It ensures that all active budgets are always returned, even if their category has been deleted.

DROP FUNCTION IF EXISTS public.get_budget_summaries(p_user_id uuid);

CREATE OR REPLACE FUNCTION get_budget_summaries(p_user_id uuid)
RETURNS TABLE(
    id bigint,
    user_id uuid,
    category_id bigint,
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
SET search_path = public
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