import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
async function go() {
  const { data, error } = await supabase.from('users').select('id, plan, generations_used, generations_limit').limit(1)
  console.log("USERS:", {data, error})
  const { data: d2, error: e2 } = await supabase.from('profiles').select('id, plan, generations_used, generations_limit').limit(1)
  console.log("PROFILES:", {data: d2, error: e2})
}
go()
