import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    switch (req.method) {
      case 'GET': { // List all pockets for the user
        const { data: pockets, error } = await supabase
          .from('pockets')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(JSON.stringify(pockets), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'POST': { // Create a new pocket
        const body = await req.json();
        const { data: newPocket, error } = await supabase
          .from('pockets')
          .insert({ ...body, user_id: user.id })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(newPocket), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        });
      }
      case 'PATCH': { // Update a pocket
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
          throw new Error('Pocket ID is required for updating.');
        }

        const { data: updatedPocket, error } = await supabase
          .from('pockets')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id) // Ensure user can only update their own pocket
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(updatedPocket), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      case 'DELETE': { // Delete a pocket
        const { id } = await req.json();

        if (!id) {
          throw new Error('Pocket ID is required for deletion.');
        }

        const { error } = await supabase.rpc('delete_pocket_and_reassign_transactions', {
          pocket_id_to_delete: id,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      default:
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        });
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
