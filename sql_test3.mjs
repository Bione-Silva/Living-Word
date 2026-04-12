import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
async function go() {
  const { data, error } = await supabase.from('credit_transactions_v1').select('id, user_id, tool_slug, credits_used')
  if (data) console.log('Transações found:', data.length)
  if (error) console.log(error)
}
go()
