const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function findRealUser() {
  const { data: sermons } = await supabase.from('sermons').select('user_id').limit(10);
  console.log('Sermon owner IDs:', sermons);
  
  const { data: mentes } = await supabase.from('brilliant_minds').select('user_id').limit(10);
  console.log('Mentes owner IDs:', mentes);
  
  // also find all users in auth.users just to be sure
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('Auth users emails and IDs:', users.users.map(u => ({ id: u.id, email: u.email })));
}

findRealUser();
