import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Transaction {
  id?: string
  amount: number
  description: string
  category_id: string
  date: string
  type: 'income' | 'expense'
  recurring?: boolean
  recurring_id?: string
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
    const action = pathSegments[pathSegments.length - 1] || 'transactions'

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, url.searchParams, action)
      case 'POST':
        return await handlePost(supabaseClient, user.id, req, action)
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req, action)
      case 'DELETE':
        return await handleDelete(supabaseClient, user.id, url.searchParams, action)
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleGet(supabaseClient: any, userId: string, searchParams: URLSearchParams, action: string) {
  switch (action) {
    case 'summary':
      return await getTransactionSummary(supabaseClient, userId, searchParams)
    case 'trends':
      return await getTransactionTrends(supabaseClient, userId, searchParams)
    case 'categories':
      return await getCategorySpending(supabaseClient, userId, searchParams)
    default:
      return await getTransactions(supabaseClient, userId, searchParams)
  }
}

async function getTransactions(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  let query = supabaseClient
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
    .order('date', { ascending: false })

  // Apply filters
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const categoryId = searchParams.get('category_id')
  const type = searchParams.get('type')
  const limit = searchParams.get('limit')

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (type) query = query.eq('type', type)
  if (limit) query = query.limit(parseInt(limit))

  const { data, error } = await query

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getTransactionSummary(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const monthDate = searchParams.get('month') || new Date().toISOString().split('T')[0]
  const startDate = `${monthDate.substring(0, 7)}-01`
  const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error

  const totalIncome = data
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)

  const totalExpenses = data
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0)

  const summary = {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_income: totalIncome - totalExpenses,
    transaction_count: data.length
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getTransactionTrends(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
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

async function getCategorySpending(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
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

async function handlePost(supabaseClient: any, userId: string, req: Request, action: string) {
  const transaction: Transaction = await req.json()
  
  const { data, error } = await supabaseClient
    .from('transactions')
    .insert({
      ...transaction,
      user_id: userId,
    })
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
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePut(supabaseClient: any, userId: string, req: Request, action: string) {
  const transaction: Transaction = await req.json()
  
  if (!transaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  const { data, error } = await supabaseClient
    .from('transactions')
    .update(transaction)
    .eq('id', transaction.id)
    .eq('user_id', userId)
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
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleDelete(supabaseClient: any, userId: string, searchParams: URLSearchParams, action: string) {
  const id = searchParams.get('id')
  
  if (!id) {
    throw new Error('Transaction ID is required for deletion')
  }

  const { error } = await supabaseClient
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}