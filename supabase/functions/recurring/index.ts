import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface RecurringTransaction {
  id?: string
  amount: number
  description: string
  category_id: string
  type: 'income' | 'expense'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_date: string
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
    const action = pathSegments[pathSegments.length - 1] || 'recurring'

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id, url.searchParams, action)
      case 'POST':
        return await handlePost(supabaseClient, user.id, req, action)
      case 'PUT':
        return await handlePut(supabaseClient, user.id, req, action)
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
  switch (action) {
    case 'upcoming':
      return await getUpcomingRecurring(supabaseClient, userId, searchParams)
    default:
      return await getRecurringTransactions(supabaseClient, userId, searchParams)
  }
}

async function getRecurringTransactions(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  let query = supabaseClient
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('next_date', { ascending: true })

  const isActive = searchParams.get('is_active')
  const type = searchParams.get('type')

  if (isActive !== null) query = query.eq('is_active', isActive === 'true')
  if (type) query = query.eq('type', type)

  const { data, error } = await query

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getUpcomingRecurring(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const daysAhead = parseInt(searchParams.get('days') || '30')
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + daysAhead)

  const { data, error } = await supabaseClient
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_date', endDate.toISOString().split('T')[0])
    .order('next_date', { ascending: true })

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePost(supabaseClient: any, userId: string, req: Request, action: string) {
  if (action === 'toggle') {
    const { id } = await req.json()
    return await toggleRecurringTransaction(supabaseClient, userId, id)
  }
  
  return await createRecurringTransaction(supabaseClient, userId, req)
}

async function createRecurringTransaction(supabaseClient: any, userId: string, req: Request) {
  const recurring: RecurringTransaction = await req.json()
  
  const { data, error } = await supabaseClient
    .from('recurring_transactions')
    .insert({
      ...recurring,
      user_id: userId,
    })
    .select('*')
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function toggleRecurringTransaction(supabaseClient: any, userId: string, recurringId: string) {
  // Get current status
  const { data: current, error: fetchError } = await supabaseClient
    .from('recurring_transactions')
    .select('is_active')
    .eq('id', recurringId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  // Toggle status
  const { data, error } = await supabaseClient
    .from('recurring_transactions')
    .update({ is_active: !current.is_active })
    .eq('id', recurringId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePut(supabaseClient: any, userId: string, req: Request, action: string) {
  const recurring: RecurringTransaction = await req.json()
  
  if (!recurring.id) {
    throw new Error('Recurring transaction ID is required for updates')
  }

  const { data, error } = await supabaseClient
    .from('recurring_transactions')
    .update(recurring)
    .eq('id', recurring.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleDelete(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  const id = searchParams.get('id')
  
  if (!id) {
    throw new Error('Recurring transaction ID is required for deletion')
  }

  const { error } = await supabaseClient
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}