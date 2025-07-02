import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const reportType = pathSegments[pathSegments.length - 1] || 'summary'

    if (req.method === 'GET') {
      return await handleGet(supabaseClient, user.id, url.searchParams, reportType)
    } else if (req.method === 'POST') {
      return await handlePost(supabaseClient, user.id, req, reportType)
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleGet(supabaseClient: any, userId: string, searchParams: URLSearchParams, reportType: string) {
  switch (reportType) {
    case 'summary':
      return await getReportSummary(supabaseClient, userId, searchParams)
    case 'trends':
      return await getTrendReport(supabaseClient, userId, searchParams)
    case 'categories':
      return await getCategoryReport(supabaseClient, userId, searchParams)
    case 'budgets':
      return await getBudgetReport(supabaseClient, userId, searchParams)
    default:
      return await getReportSummary(supabaseClient, userId, searchParams)
  }
}

async function getReportSummary(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]

  // Get transactions for the period
  const { data: transactions, error: transactionError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (transactionError) throw transactionError

  // Calculate summary statistics
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)

  const totalExpenses = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0)

  const netIncome = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

  const summary = {
    period: { start_date: startDate, end_date: endDate },
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      net_income: netIncome,
      savings_rate: savingsRate
    },
    transaction_count: {
      total: transactions.length,
      income: transactions.filter((t: any) => t.type === 'income').length,
      expense: transactions.filter((t: any) => t.type === 'expense').length
    }
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getTrendReport(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getCategoryReport(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color,
        type
      )
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('type', 'expense')

  if (error) throw error

  // Group by category
  const categorySpending = data.reduce((acc: any, transaction: any) => {
    const categoryName = transaction.categories?.name || 'Unknown'
    acc[categoryName] = (acc[categoryName] || 0) + Math.abs(parseFloat(transaction.amount))
    return acc
  }, {})

  const result = Object.entries(categorySpending).map(([name, amount]) => ({
    category_name: name,
    total_amount: amount
  }))

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getBudgetReport(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const { data: budgets, error } = await supabaseClient
    .from('budgets')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color,
        type
      )
    `)
    .eq('user_id', userId)

  if (error) throw error

  // Calculate spent amounts for each budget
  const budgetSummaries = await Promise.all(
    budgets.map(async (budget: any) => {
      const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('amount')
        .eq('category_id', budget.category_id)
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', budget.start_date)

      const spent = transactions?.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0) || 0
      const progress = (spent / parseFloat(budget.amount)) * 100

      return {
        ...budget,
        spent_amount: spent,
        progress_percentage: progress,
        status: progress > 100 ? 'over_budget' : progress > 80 ? 'near_limit' : 'on_track'
      }
    })
  )

  // Calculate budget statistics
  const budgetStats = {
    total_budgets: budgetSummaries.length,
    on_track: budgetSummaries.filter((b: any) => b.status === 'on_track').length,
    near_limit: budgetSummaries.filter((b: any) => b.status === 'near_limit').length,
    over_budget: budgetSummaries.filter((b: any) => b.status === 'over_budget').length,
    total_budgeted: budgetSummaries.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0),
    total_spent: budgetSummaries.reduce((sum: number, b: any) => sum + parseFloat(b.spent_amount), 0)
  }

  return new Response(JSON.stringify({
    statistics: budgetStats,
    budgets: budgetSummaries
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePost(supabaseClient: any, userId: string, req: Request, reportType: string) {
  if (reportType === 'export') {
    return await exportReport(supabaseClient, userId, req)
  }

  return new Response(JSON.stringify({ error: 'Invalid report action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function exportReport(supabaseClient: any, userId: string, req: Request) {
  const { start_date, end_date, format = 'csv' } = await req.json()

  // Get transactions with category details
  const { data: transactions, error } = await supabaseClient
    .from('transactions')
    .select(`
      *,
      categories (
        name,
        type
      )
    `)
    .eq('user_id', userId)
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: false })

  if (error) throw error

  if (format === 'csv') {
    // Generate CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type']
    const csvRows = [
      headers.join(','),
      ...transactions.map((t: any) => [
        t.date,
        `"${t.description}"`,
        `"${t.categories?.name || 'Unknown'}"`,
        t.amount,
        t.type
      ].join(','))
    ]

    return new Response(csvRows.join('\n'), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${start_date}-to-${end_date}.csv"`
      },
    })
  }

  // Return JSON format by default
  return new Response(JSON.stringify(transactions), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}