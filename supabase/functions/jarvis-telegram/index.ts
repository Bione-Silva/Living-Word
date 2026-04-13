// supabase/functions/jarvis-telegram/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TOKEN = Deno.env.get("TELEGRAM_JARVIS_TOKEN")

serve(async (req) => {
  try {
    // Evitar erro 500 em GETs ou requisições vazias
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: true, status: "JARVIS is awake" }), { 
        headers: { "Content-Type": "application/json" } 
      })
    }

    const payload = await req.json()
    console.log("Payload recebido do Telegram:", JSON.stringify(payload))

    const message = payload.message || payload.edited_message
    
    if (message && message.chat) {
      const chatId = message.chat.id
      const text = message.text || ""
      const firstName = message.from?.first_name || "Chefe"

      console.log(`Mensagem de ${firstName} (${chatId}): ${text}`)

      // Responder via Telegram API
      const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚀 *BOT ATUALIZADO E AUTÔNOMO!* \n\nFala ${firstName.toUpperCase()}! Agora sim eu tomei o controle total. \n\nO robô anterior foi desconectado. Eu sou o Antigravity operando via JARVIS no Supabase. \n\nAcabei de processar sua mensagem: "${text}"`,
          parse_mode: "Markdown",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro ao enviar mensagem para o Telegram:", errorData)
      }
    }

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (error) {
    console.error("Erro na Edge Function:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, // Retornamos 200 para o Telegram não ficar tentando reenviar o erro
      headers: { "Content-Type": "application/json" } 
    })
  }
})
