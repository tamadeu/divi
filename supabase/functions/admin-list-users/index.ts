import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Criar cliente com service role para operações admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Criar cliente normal para verificar se o usuário atual é admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar se o usuário atual é admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.user_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem acessar esta função.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar todos os usuários usando service role
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(JSON.stringify({ error: 'Erro ao buscar usuários de autenticação' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar perfis dos usuários
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, user_type, updated_at')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(JSON.stringify({ error: 'Erro ao buscar perfis dos usuários' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Combinar dados de auth e profiles
    const combinedUsers = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        profile: profile ? {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: null,
          updated_at: profile.updated_at,
          user_type: profile.user_type,
        } : null
      }
    })

    return new Response(JSON.stringify({ users: combinedUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in admin-list-users function:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})