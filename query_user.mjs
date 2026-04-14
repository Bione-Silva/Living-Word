import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) return console.error('Auth Error:', userError);
  
  const user = users.users.find(u => u.email === 'bx4usa@gmail.com');
  if (!user) return console.log('User not found');
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  console.log('Profile:', profile);
}

checkUser();
