const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixProfile() {
  const email = 'bionicaosilva@gmail.com';
  
  // Get user from auth
  const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const user = usersData.users.find(u => u.email === email);
  if (!user) {
    console.error('User not found in auth.users');
    return;
  }
  
  // Update profile to master/premium
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: 'Severino Bione',
      plan: 'lifetime',
      credits_remaining: 999999
    })
    .eq('id', user.id)
    .select();
    
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Profile updated successfully:', updateData);
  }
}

fixProfile();
