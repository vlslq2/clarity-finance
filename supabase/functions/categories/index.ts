import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Category {
  id?: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
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
    const searchParams = url.searchParams

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, searchParams)
      case 'POST':
        return await handlePost(supabaseClient, user.id, req)
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req)
      case 'DELETE':
        return await handleDelete(supabaseClient, user.id, searchParams)
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

async function handleGet(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  let query = supabaseClient
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  const type = searchParams.get('type')
  if (type) query = query.eq('type', type)

  const { data, error } = await query

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePost(supabaseClient: any, userId: string, req: Request) {
  const category: Category = await req.json()
  
  const { data, error } = await supabaseClient
    .from('categories')
    .insert({
      ...category,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePut(supabaseClient: any, userId: string, req: Request) {
  const category: Category = await req.json()
  
  if (!category.id) {
    throw new Error('Category ID is required for updates')
  }

  const { data, error } = await supabaseClient
    .from('categories')
    .update(category)
    .eq('id', category.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleDelete(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const id = searchParams.get('id')
  const force = searchParams.get('force') === 'true'
  
  if (!id) {
    throw new Error('Category ID is required for deletion')
  }

  // If force delete is not requested, check if category is being used
  if (!force) {
    const { data: transactions, error: transactionError } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', userId)
      .limit(1)

    if (transactionError) throw transactionError

    if (transactions && transactions.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Category is being used in transactions',
        canForceDelete: true,
        usageCount: transactions.length
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if category is being used in budgets
    const { data: budgets, error: budgetError } = await supabaseClient
      .from('budgets')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', userId)
      .limit(1)

    if (budgetError) throw budgetError

    if (budgets && budgets.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Category is being used in budgets',
        canForceDelete: true,
        usageCount: budgets.length
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if category is being used in recurring transactions
    const { data: recurring, error: recurringError } = await supabaseClient
      .from('recurring_transactions')
      .select('id')
      .eq('category_id', id)
      .eq('user_id', userId)
      .limit(1)

    if (recurringError) throw recurringError

    if (recurring && recurring.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Category is being used in recurring transactions',
        canForceDelete: true,
        usageCount: recurring.length
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // If force delete is requested, delete all related data first
  if (force) {
    // Delete all transactions using this category
    await supabaseClient
      .from('transactions')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId)

    // Delete all budgets using this category
    await supabaseClient
      .from('budgets')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId)

    // Delete all recurring transactions using this category
    await supabaseClient
      .from('recurring_transactions')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId)
  }

  // Delete the category
  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(JSON.stringify({ 
    success: true,
    forceDeleted: force
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}