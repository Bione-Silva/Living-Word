import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('chunks')
    .select('*')
    .eq('metadata->>module', 'quiz')
    .limit(5);
  
  if (error) {
    console.error('Error fetching regular chunks:', error);
    // try with knowledge schema via rpc or schema
  } else {
    console.log('Regular chunks:', data);
  }

  const { data: kData, error: kError } = await supabase
    .schema('knowledge')
    .from('chunks')
    .select('id, content, metadata')
    .eq('metadata->>item_type', 'quiz')
    .limit(3);

  if (kError) {
    console.error('Error fetching knowledge chunks:', kError);
  } else {
    console.log('Knowledge chunks:', kData);
  }
}

test();
