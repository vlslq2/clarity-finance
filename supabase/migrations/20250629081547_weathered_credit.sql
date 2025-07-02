/*
  # Transaction Summary Functions

  1. Function to get monthly transaction summaries
  2. Function to get category spending summaries
  3. Function to get transaction trends
*/

-- Function to get monthly summary for a user
CREATE OR REPLACE FUNCTION get_monthly_summary(
  user_id uuid,
  month_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_income decimal,
  total_expenses decimal,
  net_income decimal,
  transaction_count integer,
  top_category_id uuid,
  top_category_name text,
  top_category_amount decimal
) AS $$
DECLARE
  month_start date;
  month_end date;
BEGIN
  -- Calculate month boundaries
  month_start := date_trunc('month', month_date)::date;
  month_end := (date_trunc('month', month_date) + interval '1 month - 1 day')::date;
  
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) as expenses,
      COUNT(*) as tx_count
    FROM transactions t
    WHERE t.user_id = get_monthly_summary.user_id
      AND t.date >= month_start
      AND t.date <= month_end
  ),
  top_category AS (
    SELECT 
      t.category_id,
      c.name as category_name,
      SUM(ABS(t.amount)) as category_total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = get_monthly_summary.user_id
      AND t.type = 'expense'
      AND t.date >= month_start
      AND t.date <= month_end
    GROUP BY t.category_id, c.name
    ORDER BY category_total DESC
    LIMIT 1
  )
  SELECT 
    md.income,
    md.expenses,
    md.income - md.expenses,
    md.tx_count::integer,
    tc.category_id,
    tc.category_name,
    tc.category_total
  FROM monthly_data md
  LEFT JOIN top_category tc ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get category spending breakdown
CREATE OR REPLACE FUNCTION get_category_spending(
  user_id uuid,
  start_date date DEFAULT CURRENT_DATE - interval '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  category_id uuid,
  category_name text,
  category_icon text,
  category_color text,
  total_amount decimal,
  transaction_count integer,
  percentage decimal
) AS $$
BEGIN
  RETURN QUERY
  WITH category_totals AS (
    SELECT 
      c.id,
      c.name,
      c.icon,
      c.color,
      COALESCE(SUM(ABS(t.amount)), 0) as total,
      COUNT(t.id) as tx_count
    FROM categories c
    LEFT JOIN transactions t ON c.id = t.category_id 
      AND t.user_id = get_category_spending.user_id
      AND t.type = 'expense'
      AND t.date >= get_category_spending.start_date
      AND t.date <= get_category_spending.end_date
    WHERE c.user_id = get_category_spending.user_id
      AND c.type = 'expense'
    GROUP BY c.id, c.name, c.icon, c.color
  ),
  total_spending AS (
    SELECT SUM(total) as grand_total
    FROM category_totals
    WHERE total > 0
  )
  SELECT 
    ct.id,
    ct.name,
    ct.icon,
    ct.color,
    ct.total,
    ct.tx_count::integer,
    CASE 
      WHEN ts.grand_total > 0 THEN (ct.total / ts.grand_total * 100)
      ELSE 0
    END as percentage
  FROM category_totals ct
  CROSS JOIN total_spending ts
  WHERE ct.total > 0
  ORDER BY ct.total DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get transaction trends (daily totals for a period)
CREATE OR REPLACE FUNCTION get_transaction_trends(
  user_id uuid,
  start_date date DEFAULT CURRENT_DATE - interval '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date date,
  income decimal,
  expenses decimal,
  net decimal
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      get_transaction_trends.start_date,
      get_transaction_trends.end_date,
      '1 day'::interval
    )::date as date
  )
  SELECT 
    ds.date,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN ABS(t.amount) ELSE 0 END), 0) as expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -ABS(t.amount) END), 0) as net
  FROM date_series ds
  LEFT JOIN transactions t ON ds.date = t.date AND t.user_id = get_transaction_trends.user_id
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;