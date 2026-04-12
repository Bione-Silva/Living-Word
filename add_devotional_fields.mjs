import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://priumwdestycikzfcysg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI'
)
// Test which columns exist
const { data, error } = await supabase.from('devotionals').select('*').limit(1)
if (data) console.log('Colunas existentes:', Object.keys(data[0] || {}))
if (error) console.error(error)
