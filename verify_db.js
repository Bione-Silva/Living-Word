import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://priumwdestycikzfcysg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4rbffmxsDVKYaJDiA85K3Q_1QBzi3gI'; // A key that the frontend uses

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const today = new Date().toISOString().split('T')[0];
  console.log('Today is:', today);

  // Exatamente como o frontend busca
  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .eq('scheduled_date', today)
    .single();

  if (error) {
    console.error('Frontend Fetch Error:', error.message);
  } else {
    console.log('Frontend Fetch Result:');
    console.log(data);
  }
}

check();
