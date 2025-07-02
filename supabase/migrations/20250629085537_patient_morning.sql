/*
  # Add user signup trigger for default categories

  1. Functions
    - `handle_new_user()` - Creates default categories when a new user signs up
    - Automatically inserts user record and default categories

  2. Triggers
    - Trigger on `auth.users` table to call `handle_new_user()` on INSERT

  3. Default Categories
    - Creates essential expense and income categories for new users
    - Includes icons and colors for better UX
*/

-- Create the trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user into public.users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Create default expense categories
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Food & Dining', 'utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transportation', 'car', '#f97316', 'expense'),
    (NEW.id, 'Shopping', 'shopping-bag', '#eab308', 'expense'),
    (NEW.id, 'Entertainment', 'film', '#a855f7', 'expense'),
    (NEW.id, 'Bills & Utilities', 'zap', '#06b6d4', 'expense'),
    (NEW.id, 'Healthcare', 'heart', '#ec4899', 'expense'),
    (NEW.id, 'Education', 'book', '#8b5cf6', 'expense'),
    (NEW.id, 'Travel', 'plane', '#10b981', 'expense'),
    (NEW.id, 'Other Expenses', 'more-horizontal', '#6b7280', 'expense');

  -- Create default income categories
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Salary', 'briefcase', '#22c55e', 'income'),
    (NEW.id, 'Freelance', 'laptop', '#3b82f6', 'income'),
    (NEW.id, 'Investment', 'trending-up', '#f59e0b', 'income'),
    (NEW.id, 'Gift', 'gift', '#e11d48', 'income'),
    (NEW.id, 'Other Income', 'plus-circle', '#6366f1', 'income');

  -- Create default user preferences
  INSERT INTO public.user_preferences (user_id, currency, date_format, theme, notifications_enabled)
  VALUES (NEW.id, 'USD', 'MM/DD/YYYY', 'light', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;