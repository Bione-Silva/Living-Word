import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://priumwdestycikzfcysg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get user ID
  const { data: userData, error: userError } = await supabaseAdmin.from('profiles').select('id').eq('email', 'bionicaosilva@gmail.com').single();
  if (userError) {
    console.error("User error", userError);
    return;
  }
  const userId = userData.id;

  // We need to invoke the function AS the user, so we need a JWT for them.
  // We can't easily sign a JWT without the JWT secret.
  // Instead, let's just do a POST directly to the function using the ANON key. Wait, if we use the ANON key, the function receives no user.
  // The function ai-tool expects a user token to deduct credits.
  
  // Actually, we can fetch the edge function logs via Supabase Management API or using node to hit the function and see what it says!
  console.log("Found user:", userId);
}
run();
