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
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { search, limit = 50, userId } = body

    let query = supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: limit
    })

    const { data: authUsers, error: listError } = await query

    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If searching for a specific user ID
    if (userId) {
      const specificUser = authUsers.users.find(u => u.id === userId)
      if (!specificUser) {
        return new Response(
          JSON.stringify({ users: [] }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get profile data for the specific user
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', specificUser.id)
        .single()

      const userWithProfile = {
        id: specificUser.id,
        email: specificUser.email || '',
        created_at: specificUser.created_at,
        profiles: profileData
      }

      return new Response(
        JSON.stringify({ users: [userWithProfile] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get profile data for all users
    const userIds = authUsers.users.map(u => u.id)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, user_type')
      .in('id', userIds)

    // Combine auth users with profile data
    let usersWithProfiles = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email || '',
        created_at: authUser.created_at,
        profile: profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          user_type: profile.user_type
        } : null,
        profiles: profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name
        } : null
      }
    })

    // Filter by search term if provided
    if (search && search.length >= 2) {
      const searchLower = search.toLowerCase()
      usersWithProfiles = usersWithProfiles.filter(user => {
        const email = user.email.toLowerCase()
        const firstName = user.profile?.first_name?.toLowerCase() || ''
        const lastName = user.profile?.last_name?.toLowerCase() || ''
        const fullName = `${firstName} ${lastName}`.trim()
        
        return email.includes(searchLower) || 
               firstName.includes(searchLower) || 
               lastName.includes(searchLower) || 
               fullName.includes(searchLower)
      })
    }

    return new Response(
      JSON.stringify({ users: usersWithProfiles }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in admin-list-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})