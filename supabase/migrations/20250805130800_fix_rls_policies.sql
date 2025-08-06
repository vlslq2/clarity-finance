-- This migration fixes all "Auth RLS Initialization Plan" performance warnings
-- by dropping and recreating all RLS policies to use the stable `current_user_id()` function.

-- Table: recurring_transactions
DROP POLICY IF EXISTS "Users can manage their own recurring transactions" ON public.recurring_transactions;
CREATE POLICY "Users can manage their own recurring transactions"
  ON public.recurring_transactions
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

-- Table: users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (current_user_id() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (current_user_id() = id)
  WITH CHECK (current_user_id() = id);

-- Table: categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
CREATE POLICY "Users can manage their own categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

-- Table: transactions
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

-- Table: budgets
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets"
  ON public.budgets
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

-- Table: user_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

-- Table: pockets
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.pockets;
CREATE POLICY "Enable all access for users based on user_id"
  ON public.pockets
  FOR ALL
  TO authenticated
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);