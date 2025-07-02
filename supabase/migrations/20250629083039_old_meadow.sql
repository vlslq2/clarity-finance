/*
  # Recurring Transactions Functions

  1. New Tables
    - `recurring_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (decimal)
      - `description` (text)
      - `category_id` (uuid, will reference categories when available)
      - `type` (text, income/expense)
      - `frequency` (text, daily/weekly/monthly/yearly)
      - `next_date` (date)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - `calculate_next_date()` - Calculate next occurrence date
    - `process_recurring_transactions()` - Process due recurring transactions
    - `get_upcoming_recurring()` - Get upcoming recurring transactions
    - `toggle_recurring_transaction()` - Toggle active status

  3. Security
    - Enable RLS on `recurring_transactions` table
    - Add policy for authenticated users to manage their own data
*/

-- Ensure recurring_transactions table exists (without foreign key to categories for now)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL, -- Will add foreign key constraint later when categories table exists
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recurring_transactions' 
    AND policyname = 'Users can manage their own recurring transactions'
  ) THEN
    CREATE POLICY "Users can manage their own recurring transactions"
      ON recurring_transactions
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_date(
  input_date date,
  frequency text
)
RETURNS date AS $$
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
$$ LANGUAGE plpgsql;

-- Function to process due recurring transactions
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS integer AS $$
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
$$ LANGUAGE plpgsql;

-- Function to get upcoming recurring transactions
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
) AS $$
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
$$ LANGUAGE plpgsql;

-- Function to pause/resume recurring transaction
CREATE OR REPLACE FUNCTION toggle_recurring_transaction(
  p_recurring_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_date ON recurring_transactions(next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_category_id ON recurring_transactions(category_id);

-- Function to add foreign key constraint to categories when the table exists
CREATE OR REPLACE FUNCTION add_recurring_categories_fk()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Try to add the foreign key constraint (will succeed if categories table exists)
SELECT add_recurring_categories_fk();