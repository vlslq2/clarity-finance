# Clarity Finance - Supabase Backend

A comprehensive expense tracking application with a complete Supabase backend implementation.

## 🚀 Features

### Frontend Features
- **Mobile-first responsive design** with Apple-like aesthetics
- **Dashboard** with financial overview and insights
- **Transaction management** with categories and search
- **Budget tracking** with progress indicators and alerts
- **Category management** with custom icons and colors
- **Recurring transactions** with automated processing
- **Reports & Analytics** with data visualization
- **Calendar view** with multiple layout options (List & Carousel)
- **User authentication** with secure login/signup

### Backend Features
- **Complete database schema** with proper relationships
- **Row Level Security (RLS)** for data protection
- **Edge functions** for complex business logic
- **Automated recurring transaction processing**
- **Budget calculation functions**
- **Transaction summary and analytics**
- **Data export capabilities**
- **User preferences management**

## 🏗️ Database Schema

### Tables
- **categories** - Expense/income categories with icons and colors
- **transactions** - Individual financial transactions
- **budgets** - Budget limits with progress tracking
- **recurring_transactions** - Automated recurring payments/income
- **user_preferences** - User settings and preferences

### Key Features
- **Automatic default categories** created for new users
- **Budget progress calculation** with real-time spending tracking
- **Recurring transaction automation** with flexible frequencies
- **Transaction analytics** with category breakdowns and trends

## 🔧 Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration files in order:
   - `create_expense_tracker_schema.sql`
   - `add_default_categories.sql`
   - `add_budget_functions.sql`
   - `add_transaction_functions.sql`
   - `add_recurring_functions.sql`

### 2. Edge Functions Deployment
Deploy the edge functions to your Supabase project:
- `transactions` - Transaction CRUD operations
- `budgets` - Budget management with calculations
- `categories` - Category management
- `recurring` - Recurring transaction handling
- `reports` - Analytics and data export
- `user-preferences` - User settings management

### 3. Environment Variables
1. Copy `.env.example` to `.env`
2. Add your Supabase project URL and anon key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Authentication Setup
- Email/password authentication is enabled by default
- Email confirmation is disabled for easier testing
- Users get default categories automatically on signup

## 📱 API Endpoints

### Transactions
- `GET /functions/v1/transactions` - List transactions with filters
- `POST /functions/v1/transactions` - Create new transaction
- `PUT /functions/v1/transactions` - Update transaction
- `DELETE /functions/v1/transactions?id=` - Delete transaction
- `GET /functions/v1/transactions/summary` - Monthly summary
- `GET /functions/v1/transactions/trends` - Transaction trends

### Budgets
- `GET /functions/v1/budgets` - List budgets
- `GET /functions/v1/budgets/summary` - Budget summaries with progress
- `POST /functions/v1/budgets` - Create budget
- `PUT /functions/v1/budgets` - Update budget
- `DELETE /functions/v1/budgets?id=` - Delete budget

### Categories
- `GET /functions/v1/categories` - List categories
- `POST /functions/v1/categories` - Create category
- `PUT /functions/v1/categories` - Update category
- `DELETE /functions/v1/categories?id=` - Delete category

### Recurring Transactions
- `GET /functions/v1/recurring` - List recurring transactions
- `GET /functions/v1/recurring/upcoming` - Upcoming recurring transactions
- `POST /functions/v1/recurring` - Create recurring transaction
- `POST /functions/v1/recurring/toggle` - Toggle active status
- `PUT /functions/v1/recurring` - Update recurring transaction
- `DELETE /functions/v1/recurring?id=` - Delete recurring transaction

### Reports
- `GET /functions/v1/reports/summary` - Financial summary
- `GET /functions/v1/reports/trends` - Spending trends
- `GET /functions/v1/reports/categories` - Category breakdown
- `GET /functions/v1/reports/budgets` - Budget analysis
- `POST /functions/v1/reports/export` - Export data (CSV/JSON)

### User Preferences
- `GET /functions/v1/user-preferences` - Get user preferences
- `PUT /functions/v1/user-preferences` - Update preferences

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user isolation

### Authentication
- Secure JWT-based authentication
- Password requirements enforced
- Session management handled by Supabase

### Data Validation
- Input validation on all endpoints
- SQL injection protection
- Type safety with TypeScript

## 🚀 Development

### Local Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### Database Functions
The app includes several PostgreSQL functions for complex operations:
- `calculate_budget_spent()` - Real-time budget calculations
- `process_recurring_transactions()` - Automated recurring processing
- `get_monthly_summary()` - Financial summaries
- `get_category_spending()` - Category analytics

## 📊 Analytics & Reporting

### Built-in Reports
- **Monthly summaries** with income/expense totals
- **Category spending** with percentages
- **Budget progress** with alerts
- **Transaction trends** over time
- **Data export** in CSV/JSON formats

### Real-time Calculations
- Budget progress updates automatically
- Transaction summaries recalculate on changes
- Category totals update in real-time

## 🔄 Recurring Transactions

### Automation Features
- **Flexible frequencies**: Daily, weekly, monthly, yearly
- **Automatic processing** with scheduled functions
- **Pause/resume** functionality
- **Next occurrence** calculation
- **Transaction linking** to source recurring rules

### Processing Schedule
Recurring transactions are processed automatically and can be triggered manually through the API.

## 💾 Data Management

### Backup & Export
- Full transaction export in CSV format
- Date range filtering for exports
- Category and budget data included

### Data Integrity
- Foreign key constraints
- Cascade deletes for user data
- Transaction validation rules
- Budget limit enforcement

This backend provides a complete, production-ready foundation for Clarity Finance with robust security, scalability, and feature completeness.

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Environment Setup
Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

**Clarity Finance** - Clear insights into your financial future.