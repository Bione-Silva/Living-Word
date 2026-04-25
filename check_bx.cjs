const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function findRealUser() {
  const oldId = '945f6c31-52a1-46a5-91f9-ed1954c3ae06';
  
  const { data: sermons } = await supabase.from('sermons').select('id, title, user_id').eq('user_id', oldId);
  console.log('Sermon owner IDs:', sermons);
  
  const { data: mentes } = await supabase.from('brilliant_minds').select('id').eq('user_id', oldId);
  console.log('Mentes owner IDs:', mentes);
  
  // Actually, what if they don't use user_id?
  // Let's just list 10 of them
  const { data: anyMentes } = await supabase.from('brilliant_minds').select('*').limit(3);
  console.log('Any mentes:', anyMentes);
  
}

findRealUser();
