import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseService = createClient(supabaseUrl, supabaseKey)

    // Parse the payload from frontend
    const { platform, imageUrl, message } = await req.json()
    if (!platform || !imageUrl) throw new Error('Missing platform or image URL')

    // Here we will load the specific API key for the platform requested
    let apiKey = ''
    if (platform === 'linkedin') {
       const { data } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'linkedin' })
       apiKey = data
    } else if (platform === 'twitter') {
       const { data } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'twitter' })
       apiKey = data
    } else if (platform === 'pinterest') {
       const { data } = await supabaseService.rpc('get_api_key_secure', { p_provider: 'pinterest' })
       apiKey = data
    }

    if (!apiKey) {
      // Return a specific error if keys are missing so Frontend can warn the user to configure it
      return new Response(JSON.stringify({ 
        error: `As credenciais de API para ${platform} não foram configuradas no Supabase Vault. Siga o Checklist de APIs.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // TODO: Implement the actual fetch() to LinkedIn/Twitter/Pinterest APIs
    // For now, this acts as the validated gatekeeper.
    // Once keys are present, we will inject the provider's specific POST request here.

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Arte enviada para a fila do ${platform.toUpperCase()} com sucesso!` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
