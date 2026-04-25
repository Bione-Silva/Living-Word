const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAllData() {
  const { data: sermons, error: sErr } = await supabase.from('sermons').select('*').limit(5);
  console.log('Sermons count/error:', sermons?.length, sErr);
  
  const { data: mentes, error: mErr } = await supabase.from('brilliant_minds').select('*').limit(5);
  console.log('Mentes count/error:', mentes?.length, mErr);
  
  if (sermons && sermons.length > 0) {
    console.log('Sermon example:', sermons[0]);
  }
}

checkAllData();
