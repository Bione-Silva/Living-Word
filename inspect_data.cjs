const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspectData() {
  const oldId = '945f6c31-52a1-46a5-91f9-ed1954c3ae06'; // bx4usa@gmail.com
  const newId = 'e87b344e-720b-44de-b67f-32972560ad24'; // bionicaosilva@gmail.com
  
  const { data: mS_old } = await supabase.from('mind_settings').select('*').eq('user_id', oldId);
  const { data: s_old } = await supabase.from('sermons').select('*').eq('user_id', oldId);
  
  console.log(`Old ID (${oldId}) -> mind_settings: ${mS_old?.length || 0}, sermons: ${s_old?.length || 0}`);
  
  // also what if he had another ID? Let's get ALL sermons without filtering user_id
  const { data: allSermons } = await supabase.from('sermons').select('user_id');
  console.log('All sermons user_ids:', allSermons ? [...new Set(allSermons.map(s => s.user_id))] : null);
  
  const { data: allMS } = await supabase.from('mind_settings').select('user_id');
  console.log('All mind_settings user_ids:', allMS ? [...new Set(allMS.map(s => s.user_id))] : null);
}

inspectData();
