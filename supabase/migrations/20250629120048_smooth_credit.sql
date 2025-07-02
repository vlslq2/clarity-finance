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

  -- Create default expense categories in Romanian
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Mâncare și restaurante', 'utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transport', 'car', '#f97316', 'expense'),
    (NEW.id, 'Cumpărături', 'shopping-bag', '#eab308', 'expense'),
    (NEW.id, 'Divertisment', 'film', '#a855f7', 'expense'),
    (NEW.id, 'Facturi și utilități', 'zap', '#06b6d4', 'expense'),
    (NEW.id, 'Sănătate', 'heart', '#ec4899', 'expense'),
    (NEW.id, 'Educație', 'book', '#8b5cf6', 'expense'),
    (NEW.id, 'Călătorii', 'plane', '#10b981', 'expense'),
    (NEW.id, 'Alte cheltuieli', 'more-horizontal', '#6b7280', 'expense');

  -- Create default income categories in Romanian
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Salariu', 'briefcase', '#22c55e', 'income'),
    (NEW.id, 'Freelancing', 'laptop', '#3b82f6', 'income'),
    (NEW.id, 'Investiții', 'trending-up', '#f59e0b', 'income'),
    (NEW.id, 'Cadou', 'gift', '#e11d48', 'income'),
    (NEW.id, 'Alte venituri', 'plus-circle', '#6366f1', 'income');

  -- Create default user preferences
  INSERT INTO public.user_preferences (user_id, currency, date_format, theme, notifications_enabled)
  VALUES (NEW.id, 'RON', 'DD/MM/YYYY', 'light', true);

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