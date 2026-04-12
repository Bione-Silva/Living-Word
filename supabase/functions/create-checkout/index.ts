import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../common/utils.ts"

// O credits.ts agora tem os mapeamentos de preços
import {
  STRIPE_PRICE_TO_PLAN,
  STRIPE_ADDON_PRICE_IDS
} from "../common/credits.ts"

// Lista de preços do script setup_stripe.js
// Precisamos carregar eles aqui ou manter um mapeamento local (melhor importar)
// Como STRIPE_PRICE_TO_PLAN só traduz ID -> Plan, precisamos do reverso (Plan -> Region -> ID).
// Mas no runtime da edge function, é mais fácil buscar no banco de dados, ou ter um config literal.
// Vamos fazer um map simples para as 3 regiões com base na estrutura que sabemos.
// Para ficar desacoplado, o ideal era o Supabase já ter isso em uma tabela, mas como
// fizemos hardcoded, vamos receber o `price_id` direto do client, ou o client 
// manda { plan: "starter", region: "BRL" } e a gente traduz aqui.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Pegar o price_id solicitado
    const body = await req.json()
    const { priceId, successUrl, cancelUrl, extraSeats = 0, stripeAddonPriceId } = body

    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId it's required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Identificar qual o plano desse price_id
    const plan = STRIPE_PRICE_TO_PLAN[priceId]
    if (!plan && !STRIPE_ADDON_PRICE_IDS.includes(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Pegar informações do usuário no banco
    const { data: dbUser } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    let customerId = dbUser?.stripe_customer_id

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")
    if (!STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY not set")
    }

    // Se não tem customer_id ainda, criamos no stripe
    if (!customerId) {
        const formData = new URLSearchParams()
        formData.append('email', user.email!)
        if (dbUser?.full_name) {
            formData.append('name', dbUser.full_name)
        }
        
        const customerRes = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })

        const customerInfo = await customerRes.json()
        if (customerInfo.error) {
             throw new Error(customerInfo.error.message)
        }
        customerId = customerInfo.id

        // Salvar no bd
        await adminClient.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id)
    }

    // Montar os itens de checkout
    const lineItems = new URLSearchParams()

    // 1. O plano principal
    lineItems.append('line_items[0][price]', priceId)
    lineItems.append('line_items[0][quantity]', '1')

    // 2. Se for Igreja e tiver extraSeats, precisamos adicionar o addon correspondente à MESMA moeda.
    // Como saber a moeda? O Stripe vai barrar se misturar moedas. O ideal é o Frontend já mandar o stripeAddonPriceId na mesma moeda.
    // Ou simplesmente o Frontend manda o stripeAddonPriceId no payload.
    // Vamos assumir que a chamada REST envia stripeAddonPriceId, se aplicável:
    // (a variavel stripeAddonPriceId ja foi lida do body acima)
    
    if (plan === "church" && extraSeats > 0 && stripeAddonPriceId) {
        lineItems.append('line_items[1][price]', stripeAddonPriceId)
        lineItems.append('line_items[1][quantity]', extraSeats.toString())
    }

    // Outros campos da sessão
    lineItems.append('customer', customerId)
    lineItems.append('mode', 'subscription')
    lineItems.append('success_url', successUrl ?? `${req.headers.get("origin")}/pagamento-sucesso`)
    lineItems.append('cancel_url', cancelUrl ?? `${req.headers.get("origin")}/planos`)
    lineItems.append('billing_address_collection', 'required') // OBRIGATÓRIO PARA GEO PRICING

    // Opcional: Se quiser forçar que o cara forneça um TAX ID valido
    lineItems.append('tax_id_collection[enabled]', 'true')

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: lineItems
    })

    const sessionData = await sessionRes.json()

    if (sessionData.error) {
        throw new Error(sessionData.error.message)
    }

    return new Response(
      JSON.stringify({ url: sessionData.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )

  } catch (error) {
    console.error("Create checkout error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
