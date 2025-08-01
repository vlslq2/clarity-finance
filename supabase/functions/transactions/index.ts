
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { Transaction as AppTransaction } from '../../../src/types/index.ts';

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
  pocket_id: string
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
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleGet(supabaseClient: SupabaseClient, userId: string, searchParams: URLSearchParams, action: string) {
  switch (action) {
    case 'summary':
      return await getTransactionSummary(supabaseClient, userId, searchParams)
    default:
      return await getTransactions(supabaseClient, userId, searchParams)
  }
}

async function getTransactions(supabaseClient: SupabaseClient, userId: string, searchParams: URLSearchParams) {
  let query = supabaseClient
    .from('transactions')
    .select(`*, categories (*), pockets (*)`)
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const limit = searchParams.get('limit')
  if (limit) query = query.limit(parseInt(limit))

  const { data, error } = await query
  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getTransactionSummary(supabaseClient: SupabaseClient, userId: string, searchParams: URLSearchParams) {
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
    .filter((t: AppTransaction) => t.type === 'income')
    .reduce((sum: number, t: AppTransaction) => sum + t.amount, 0)

  const totalExpenses = data
    .filter((t: AppTransaction) => t.type === 'expense')
    .reduce((sum: number, t: AppTransaction) => sum + Math.abs(t.amount), 0)

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

async function handlePost(supabaseClient: SupabaseClient, userId: string, req: Request, _action: string) {
  const transaction: Transaction = await req.json()

  const { data, error } = await supabaseClient
    .from('transactions')
    .insert({ ...transaction, user_id: userId })
    .select(`*, categories (*), pockets (*)`)
    .single()

  if (error) throw error

  const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
  const { error: rpcError } = await supabaseClient.rpc('update_pocket_balance', {
    pocket_id_to_update: transaction.pocket_id,
    amount_change: amountChange,
  })

  if (rpcError) throw rpcError

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handlePut(supabaseClient: SupabaseClient, userId: string, req: Request, _action: string) {
  const newTransaction: Transaction = await req.json()
  
  if (!newTransaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  const { data: oldTransaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('id', newTransaction.id)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError;

  // Revert the old transaction amount from the old pocket
  const oldAmountChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
  if (oldTransaction.pocket_id) {
    const { error: revertRpcError } = await supabaseClient.rpc('update_pocket_balance', {
      pocket_id_to_update: oldTransaction.pocket_id,
      amount_change: oldAmountChange,
    })
    if (revertRpcError) throw revertRpcError;
  }

  // Update the transaction details
  const { data, error } = await supabaseClient
    .from('transactions')
    .update(newTransaction)
    .eq('id', newTransaction.id)
    .eq('user_id', userId)
    .select(`*, categories (*), pockets (*)`)
    .single()

  if (error) throw error

  // Apply the new transaction amount to the new pocket
  const newAmountChange = newTransaction.type === 'income' ? newTransaction.amount : -newTransaction.amount;
  const { error: applyRpcError } = await supabaseClient.rpc('update_pocket_balance', {
    pocket_id_to_update: newTransaction.pocket_id,
    amount_change: newAmountChange,
  })
  if (applyRpcError) throw applyRpcError;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleDelete(supabaseClient: SupabaseClient, userId: string, searchParams: URLSearchParams, _action: string) {
  const id = searchParams.get('id')
  
  if (!id) {
    throw new Error('Transaction ID is required for deletion')
  }

  const { data: transactionToDelete, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError;

  // Revert the transaction amount from its pocket
  if (transactionToDelete.pocket_id) {
    const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
    const { error: rpcError } = await supabaseClient.rpc('update_pocket_balance', {
      pocket_id_to_update: transactionToDelete.pocket_id,
      amount_change: amountChange,
    })
    if (rpcError) throw rpcError;
  }

  // Delete the transaction
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