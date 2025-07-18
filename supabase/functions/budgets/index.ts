import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Budget {
  id?: string
  category_id: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  is_active: boolean
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
    const action = pathSegments[pathSegments.length - 1] || 'budgets'

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, url.searchParams, action)
      case 'POST':
        return await handlePost(supabaseClient, user.id, req)
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req)
      case 'DELETE':
        return await handleDelete(supabaseClient, user.id, url.searchParams)
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
  if (action === 'summary') {
    return await getBudgetSummaries(supabaseClient, userId)
  }
  
  return await getBudgets(supabaseClient, userId, searchParams)
}

async function getBudgets(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  let query = supabaseClient
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
    .order('created_at', { ascending: false })

  const categoryId = searchParams.get('category_id')
  const period = searchParams.get('period')

  if (categoryId) query = query.eq('category_id', categoryId)
  if (period) query = query.eq('period', period)

  const { data, error } = await query

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getBudgetSummaries(supabaseClient: any, userId: string) {
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

  return new Response(JSON.stringify(budgetSummaries), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePost(supabaseClient: any, userId: string, req: Request) {
  const budget: Budget = await req.json()
  
  const { data, error } = await supabaseClient
    .from('budgets')
    .insert({
      ...budget,
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

async function handlePut(supabaseClient: any, userId: string, req: Request) {
  const budget: Budget = await req.json()
  
  if (!budget.id) {
    throw new Error('Budget ID is required for updates')
  }

  const { data, error } = await supabaseClient
    .from('budgets')
    .update(budget)
    .eq('id', budget.id)
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

async function handleDelete(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const id = searchParams.get('id')
  
  if (!id) {
    throw new Error('Budget ID is required for deletion')
  }

  const { error } = await supabaseClient
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}