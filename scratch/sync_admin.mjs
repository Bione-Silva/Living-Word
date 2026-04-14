
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = 'bione22@gmail.com';
const password = 'LivingWord2026@';

async function syncUser() {
  console.log(`Checking user: ${email}...`);
  
  // Try to find user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (user) {
    console.log(`User found. ID: ${user.id}. Resetting password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    });
    
    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('Password updated successfully.');
    }
  } else {
    console.log('User not found. Creating user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: 'Bione Silva' }
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
    } else {
      console.log('User created successfully. ID:', newUser.user.id);
      
      // Also ensure profile exists in public.profiles if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          full_name: 'Bione Silva',
          email: email,
          plan: 'igreja' // Grant highest access
        });
        
      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('Profile created with master access.');
      }
    }
  }
}

syncUser();
