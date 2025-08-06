-- This migration fixes all the "Function Search Path Mutable" warnings from the Supabase advisor.
-- It does this by explicitly setting the search_path for each function.

-- From 20250629081547_weathered_credit.sql
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
) 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

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
) 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

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
) 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- From 20250629083039_old_meadow.sql
CREATE OR REPLACE FUNCTION calculate_next_date(
  input_date date,
  frequency text
)
RETURNS date 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      RETURN input_date + interval '1 day';
    WHEN 'weekly' THEN
      RETURN input_date + interval '1 week';
    WHEN 'monthly' THEN
      RETURN input_date + interval '1 month';
    WHEN 'yearly' THEN
      RETURN input_date + interval '1 year';
    ELSE
      RETURN input_date + interval '1 month';
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS integer 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recurring_record record;
  transactions_created integer := 0;
BEGIN
  -- Loop through all active recurring transactions that are due
  FOR recurring_record IN
    SELECT * FROM recurring_transactions
    WHERE is_active = true
      AND next_date <= CURRENT_DATE
  LOOP
    -- Create the transaction (only if transactions table exists)
    BEGIN
      INSERT INTO transactions (
        user_id,
        amount,
        description,
        category_id,
        date,
        type,
        recurring,
        recurring_id
      ) VALUES (
        recurring_record.user_id,
        recurring_record.amount,
        recurring_record.description,
        recurring_record.category_id,
        recurring_record.next_date,
        recurring_record.type,
        true,
        recurring_record.id
      );
      
      transactions_created := transactions_created + 1;
    EXCEPTION
      WHEN undefined_table THEN
        -- Skip if transactions table doesn't exist yet
        NULL;
    END;
    
    -- Update the next occurrence date
    UPDATE recurring_transactions
    SET next_date = calculate_next_date(next_date, frequency),
        updated_at = now()
    WHERE id = recurring_record.id;
  END LOOP;
  
  RETURN transactions_created;
END;
$$;

CREATE OR REPLACE FUNCTION get_upcoming_recurring(
  p_user_id uuid,
  days_ahead integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  amount decimal,
  description text,
  category_name text,
  category_icon text,
  category_color text,
  type text,
  frequency text,
  next_date date,
  days_until integer
) 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check if categories table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    RETURN QUERY
    SELECT 
      rt.id,
      rt.amount,
      rt.description,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      rt.type,
      rt.frequency,
      rt.next_date,
      (rt.next_date - CURRENT_DATE)::integer as days_until
    FROM recurring_transactions rt
    LEFT JOIN categories c ON rt.category_id = c.id
    WHERE rt.user_id = p_user_id
      AND rt.is_active = true
      AND rt.next_date <= CURRENT_DATE + (days_ahead || ' days')::interval
    ORDER BY rt.next_date ASC;
  ELSE
    -- Return without category details if categories table doesn't exist
    RETURN QUERY
    SELECT 
      rt.id,
      rt.amount,
      rt.description,
      'Unknown'::text as category_name,
      'Circle'::text as category_icon,
      '#6B7280'::text as category_color,
      rt.type,
      rt.frequency,
      rt.next_date,
      (rt.next_date - CURRENT_DATE)::integer as days_until
    FROM recurring_transactions rt
    WHERE rt.user_id = p_user_id
      AND rt.is_active = true
      AND rt.next_date <= CURRENT_DATE + (days_ahead || ' days')::interval
    ORDER BY rt.next_date ASC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_recurring_transaction(
  p_recurring_id uuid,
  p_user_id uuid
)
RETURNS boolean 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_status boolean;
BEGIN
  -- Get current status
  SELECT is_active INTO current_status
  FROM recurring_transactions
  WHERE id = p_recurring_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Toggle status
  UPDATE recurring_transactions
  SET is_active = NOT current_status,
      updated_at = now()
  WHERE id = p_recurring_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION add_recurring_categories_fk()
RETURNS void 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Add foreign key constraint if categories table exists and constraint doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'recurring_transactions_category_id_fkey'
    ) THEN
      ALTER TABLE recurring_transactions 
      ADD CONSTRAINT recurring_transactions_category_id_fkey 
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
    END IF;
  END IF;
END;
$$;

-- From 20250629084454_late_sea.sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user record
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Create default categories for the new user
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Food & Dining', 'utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transportation', 'car', '#f97316', 'expense'),
    (NEW.id, 'Shopping', 'shopping-bag', '#eab308', 'expense'),
    (NEW.id, 'Entertainment', 'film', '#22c55e', 'expense'),
    (NEW.id, 'Bills & Utilities', 'receipt', '#3b82f6', 'expense'),
    (NEW.id, 'Healthcare', 'heart', '#8b5cf6', 'expense'),
    (NEW.id, 'Education', 'book', '#06b6d4', 'expense'),
    (NEW.id, 'Travel', 'plane', '#f59e0b', 'expense'),
    (NEW.id, 'Salary', 'briefcase', '#10b981', 'income'),
    (NEW.id, 'Freelance', 'laptop', '#6366f1', 'income'),
    (NEW.id, 'Investment', 'trending-up', '#8b5cf6', 'income'),
    (NEW.id, 'Other Income', 'plus-circle', '#64748b', 'income');

  -- Create default user preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- From 20250801091457_update_pocket_balance_function.sql
DROP FUNCTION IF EXISTS public.update_pocket_balance(bigint, numeric);
CREATE OR REPLACE FUNCTION public.update_pocket_balance(
    pocket_id_to_update bigint,
    amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify that the user calling the function owns the pocket they are trying to update
    SELECT user_id INTO v_user_id
    FROM public.pockets
    WHERE id = pocket_id_to_update;

    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Pocket not found or you are not authorized to update it.';
    END IF;

    -- If ownership is confirmed, proceed with the update
    UPDATE public.pockets
    SET balance = balance + amount_change
    WHERE id = pocket_id_to_update;
END;
$$;

-- From 20250801093817_delete_pocket_function.sql
DROP FUNCTION IF EXISTS public.delete_pocket_and_reassign_transactions(bigint);
CREATE OR REPLACE FUNCTION public.delete_pocket_and_reassign_transactions(
    pocket_id_to_delete bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_pocket_to_delete public.pockets;
    v_new_default_pocket_id bigint;
BEGIN
    -- Get the user_id and details from the pocket being deleted
    SELECT * INTO v_pocket_to_delete FROM public.pockets WHERE id = pocket_id_to_delete;
    v_user_id := v_pocket_to_delete.user_id;

    -- If the pocket to be deleted is the default one
    IF v_pocket_to_delete.is_default THEN
        -- Find another pocket to set as the new default
        SELECT id INTO v_new_default_pocket_id 
        FROM public.pockets 
        WHERE user_id = v_user_id AND id != pocket_id_to_delete
        ORDER BY created_at
        LIMIT 1;

        -- If no other pocket is available, we can't delete the last one
        IF v_new_default_pocket_id IS NULL THEN
            RAISE EXCEPTION 'Cannot delete the last remaining pocket.';
        END IF;

        -- Update the new pocket to be the default
        UPDATE public.pockets 
        SET is_default = true 
        WHERE id = v_new_default_pocket_id;
    ELSE
        -- If we are not deleting the default pocket, we will reassign to the existing default
        SELECT id INTO v_new_default_pocket_id
        FROM public.pockets
        WHERE user_id = v_user_id AND is_default = true;

        -- This should ideally not happen if every user has a default pocket
        IF v_new_default_pocket_id IS NULL THEN
            RAISE EXCEPTION 'No default pocket found to reassign transactions to.';
        END IF;
    END IF;

    -- Re-assign transactions to the new default pocket
    UPDATE public.transactions
    SET pocket_id = v_new_default_pocket_id
    WHERE pocket_id = pocket_id_to_delete;

    -- Delete the now-empty pocket
    DELETE FROM public.pockets
    WHERE id = pocket_id_to_delete;
END;
$$;

-- From 20250801095640_transfer_between_pockets_function.sql
DROP FUNCTION IF EXISTS public.transfer_between_pockets(numeric, bigint, bigint);
CREATE OR REPLACE FUNCTION public.transfer_between_pockets(
    amount numeric,
    from_pocket_id bigint,
    to_pocket_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- From 20250802161600_fix_delete_pocket_function.sql
DROP FUNCTION IF EXISTS public.delete_pocket_and_reassign_transactions(bigint);
CREATE OR REPLACE FUNCTION public.delete_pocket_and_reassign_transactions(
    pocket_id_to_delete bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    default_pocket_id bigint;
BEGIN
    -- Find the pocket to be deleted and verify ownership
    SELECT user_id INTO v_user_id
    FROM public.pockets
    WHERE id = pocket_id_to_delete;

    -- Verify that the user calling the function owns this pocket
    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Pocket not found or you are not authorized to delete it.';
    END IF;

    -- Find the user's default pocket to reassign transactions to
    SELECT id INTO default_pocket_id
    FROM public.pockets
    WHERE user_id = v_user_id AND is_default = true;

    -- Ensure a default pocket exists
    IF default_pocket_id IS NULL THEN
        RAISE EXCEPTION 'No default pocket found to reassign transactions to.';
    END IF;

    -- Prevent the user from deleting their default pocket
    IF pocket_id_to_delete = default_pocket_id THEN
        RAISE EXCEPTION 'You cannot delete your default pocket.';
    END IF;

    -- Re-assign all transactions from the deleted pocket to the default pocket.
    -- The RLS policy on the 'transactions' table allows this update.
    UPDATE public.transactions
    SET pocket_id = default_pocket_id
    WHERE pocket_id = pocket_id_to_delete;

    -- Finally, delete the pocket.
    -- The RLS policy on the 'pockets' table allows this deletion.
    DELETE FROM public.pockets
    WHERE id = pocket_id_to_delete;
END;
$$;

-- From 20250804080300_create_get_budget_summaries_function.sql
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
            t.date >= date_trunc('month', now()) AND
            t.date < date_trunc('month', now()) + interval '1 month'
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
$$;