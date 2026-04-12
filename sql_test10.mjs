import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://osusqcbyybfuwdewvbai.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXNxY2J5eWJmdXdkZXd2YmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzMxNDksImV4cCI6MjA5MDgwOTE0OX0.j-_U1JKVA5ypFn-6beMqOrRTgswdl1L7-SRn6RTv5GQ'
)
async function go() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  console.log("PROFILES:", {data, error})
  const { data: d2, error: e2 } = await supabase.from('generation_logs').select('*').limit(1)
  console.log("GENERATION LOGS:", {data: d2, error: e2})
}
go()
