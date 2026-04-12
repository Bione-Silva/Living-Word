import { createClient } from '@supabase/supabase-js';

const url = "https://priumwdestycikzfcysg.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI";

const supabase = createClient(url, key);

async function check() {
  const { data: p, error: ep } = await supabase.from('profiles').select('id').limit(1);
  if (ep) {
    console.log("PROFILES ERROR:", ep.message, ep.code);
  } else {
    console.log("PROFILES EXISTS!");
  }
  
  const { data: u, error: eu } = await supabase.from('users').select('id').limit(1);
  if (eu) {
    console.log("USERS ERROR:", eu.message, eu.code);
  } else {
    console.log("USERS EXISTS!");
  }
}

check();
