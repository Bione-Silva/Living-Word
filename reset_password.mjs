import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const emailSearch = 'bionic'; // we'll match loosely
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('List error:', listError);
    return;
  }
  
  console.log('List of users found:', users.users.map(u => ({ id: u.id, email: u.email })));
  
  const targetUser = users.users.find(u => u.email && (u.email.includes('bx') || u.email.includes('bionic')));
  
  if (!targetUser) {
    console.log('User not found!');
    return;
  }
  
  console.log(`Found target user! Email: ${targetUser.email}, ID: ${targetUser.id}`);
  
  const newPassword = "LivingWord2026!";
  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUser.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('Update error:', error);
  } else {
    console.log(`SUCCESS! Changed password for ${targetUser.email} to: ${newPassword}`);
  }
}

resetPassword();
