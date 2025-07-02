/*
  # Add Default Categories for New Users

  1. Function to create default categories for new users
  2. Trigger to automatically create default categories on user signup
*/

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (user_id, 'Food & Dining', 'UtensilsCrossed', '#ef4444', 'expense'),
    (user_id, 'Transportation', 'Car', '#3b82f6', 'expense'),
    (user_id, 'Shopping', 'ShoppingBag', '#8b5cf6', 'expense'),
    (user_id, 'Bills & Utilities', 'Receipt', '#f59e0b', 'expense'),
    (user_id, 'Entertainment', 'Film', '#ec4899', 'expense'),
    (user_id, 'Healthcare', 'Heart', '#10b981', 'expense'),
    (user_id, 'Education', 'GraduationCap', '#06b6d4', 'expense'),
    (user_id, 'Travel', 'Plane', '#84cc16', 'expense'),
    (user_id, 'Salary', 'Banknote', '#10b981', 'income'),
    (user_id, 'Freelance', 'Briefcase', '#06b6d4', 'income'),
    (user_id, 'Investment', 'TrendingUp', '#8b5cf6', 'income'),
    (user_id, 'Other Income', 'DollarSign', '#f59e0b', 'income');
END;
$$ LANGUAGE plpgsql;

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION create_default_preferences(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_preferences (user_id, currency, date_format, theme, notifications_enabled, budget_alerts)
  VALUES (user_id, 'USD', 'MM/dd/yyyy', 'light', true, true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create default categories
  PERFORM create_default_categories(NEW.id);
  
  -- Create default preferences
  PERFORM create_default_preferences(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();