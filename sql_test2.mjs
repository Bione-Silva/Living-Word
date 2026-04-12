import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
async function go() {
  const { data, error } = await supabase.rpc('run_sql', { query: `
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('users', 'profiles', 'generation_logs')
  `})
  if (data) console.log(data)
  if (error) console.log(error)
}
go()
