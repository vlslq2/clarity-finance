-- Drop the old, incorrect function to ensure a clean state
DROP FUNCTION IF EXISTS public.get_budget_summaries(p_user_id uuid);

-- Create the new, correct, and high-performance function
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
) AS $$
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
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        c.type AS category_type
    FROM
        budgets b
    JOIN
        categories c ON b.category_id = c.id
    LEFT JOIN
        monthly_expenses me ON b.category_id = me.category_id
    WHERE
        b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;