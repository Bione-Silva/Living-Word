const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osusqcbyybfuwdewvbai.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXNxY2J5eWJmdXdkZXd2YmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzMxNDksImV4cCI6MjA5MDgwOTE0OX0.j-_U1JKVA5ypFn-6beMqOrRTgswdl1L7-SRn6RTv5GQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: characters, error: charError } = await supabase.from('lw_characters').select('id, nome');
  console.log('lw_characters count:', characters ? characters.length : 0);
  if (charError) console.error('Error fetching lw_characters:', charError);

  const { data: docs, error: docError } = await supabase.schema('knowledge').from('documents').select('id, title');
  console.log('knowledge.documents:', docs);
  if (docError) console.error('Error fetching docs:', docError);
}

check();
