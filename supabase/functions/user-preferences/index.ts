import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
}

interface UserPreferences {
  currency: string
  date_format: string
  theme: string
  notifications_enabled: boolean
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

    switch (req.method) {
      case 'GET':
        return await handleGet(supabaseClient, user.id)
      case 'POST':
      case 'PUT':
        return await handleUpsert(supabaseClient, user.id, req)
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

async function handleGet(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error
  }

  // Return default preferences if none exist
  const defaultPreferences = {
    currency: 'USD',
    date_format: 'MM/dd/yyyy',
    theme: 'light',
    notifications_enabled: true
  }

  return new Response(JSON.stringify(data || defaultPreferences), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleUpsert(supabaseClient: any, userId: string, req: Request) {
  const preferences: UserPreferences = await req.json()
  
  const { data, error } = await supabaseClient
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences
    })
    .select()
    .single()

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}