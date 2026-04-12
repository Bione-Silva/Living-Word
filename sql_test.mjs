import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
async function go() {
  const { data: genLogs, error: genErr } = await supabase.from('generation_logs').select('*').limit(1)
  console.log('generation_logs:', !!genLogs)
  if (genLogs) console.log('generation_logs keys:', Object.keys(genLogs[0] || {}))
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1)
  if (users) {
    if (users.length > 0) {
      console.log('users keys:', Object.keys(users[0]))
    } else {
        console.log('users table exists but is empty')
    }
  } else {
    console.log('users table does not exist or error:', uErr)
  }
}
go()
