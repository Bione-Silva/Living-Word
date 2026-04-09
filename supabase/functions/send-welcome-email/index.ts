import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();

    // Apenas responde a inserts da tabela profiles
    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const { email, full_name } = payload.record;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email provided" }), { status: 400 });
    }

    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY não configurada.");
      return new Response(JSON.stringify({ error: "Brevo API Key is missing" }), { status: 500 });
    }

    // Chamada para a API do Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Living Word",
          email: "info@livingwordgo.com" // Email remente oficial
        },
        to: [
          {
            email: email,
            name: full_name || "Membro Living Word"
          }
        ],
        subject: "Bem-vindo à Living Word!",
        htmlContent: `
          <html>
            <body>
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #6d4c41;">Olá, ${full_name || 'Membro'}!</h2>
                <p>Que alegria ter você na <strong>Living Word</strong>.</p>
                <p>Nossa plataforma foi desenhada para equipar líderes, pastores e estudantes com as melhores ferramentas e inteligência teológica.</p>
                <p>Seu acesso já está liberado. Faça login e comece sua jornada.</p>
                <p>Deus abençoe rica e abundantemente,</p>
                <p><strong>Equipe Living Word</strong><br>
                <span style="font-size: 12px; color: #888;">info@livingwordgo.com</span></p>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Erro ao enviar email pelo Brevo:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: "Welcome email sent" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
