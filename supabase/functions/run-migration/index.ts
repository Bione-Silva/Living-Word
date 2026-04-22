import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sql = `
    ALTER TABLE public.social_calendar_posts
      ADD COLUMN IF NOT EXISTS slides_data     JSONB        DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS format_id       TEXT         DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS canvas_template TEXT         DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS theme_config    JSONB        DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS slide_count     INTEGER      DEFAULT 1,
      ADD COLUMN IF NOT EXISTS topic           TEXT         DEFAULT NULL;
  `;

  const { data, error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql }).maybeSingle();
  
  // Direct approach using the postgres client
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql_query: sql }),
  });

  return new Response(JSON.stringify({ data, error, response_status: response.status }), {
    headers: { "Content-Type": "application/json" },
  });
});
