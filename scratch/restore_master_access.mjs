import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreMasterAccess() {
  console.log("Searching for master user...");
  
  // Find all users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('List error:', listError);
    return;
  }
  
  // Look for the user
  const targetUser = users.users.find(u => u.email && (u.email.includes('bx') || u.email.includes('bionic') || u.email.includes('severinobione')));
  
  if (!targetUser) {
    console.log('Master user not found in Auth system. List of current users:');
    console.log(users.users.map(u => u.email));
    return;
  }
  
  console.log(`Found target auth user! Email: ${targetUser.email}, ID: ${targetUser.id}`);
  
  // Reset Password
  const newPassword = "LivingWord2026!";
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    targetUser.id,
    { password: newPassword }
  );
  
  if (updateError) {
    console.error('Failed to update auth password:', updateError);
  } else {
    console.log(`SUCCESS! Changed password for ${targetUser.email} to: ${newPassword}`);
  }

  // Check and update profile table
  console.log("Updating profile permissions to Pastor Pro...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUser.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
  }

  if (profile) {
      console.log('Profile found, updating to pastor_pro status...');
      const { error: upgradeError } = await supabase
        .from('profiles')
        .update({ subscription_plan: 'pastor_pro' })
        .eq('id', targetUser.id);
        
      if (upgradeError) {
          console.error("Failed to upgrade plan to pastor_pro:", upgradeError);
      } else {
          console.log("Profile upgraded to pastor_pro!");
      }
  } else {
      console.log('Profile not found for this user in public.profiles. Attempting to create one...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
            id: targetUser.id, 
            full_name: 'Severino Bione', 
            subscription_plan: 'pastor_pro' 
        }]);
        
      if (insertError) {
          console.error("Failed to insert profile:", insertError);
      } else {
          console.log("New Pastor Pro profile created!");
      }
  }
}

restoreMasterAccess();
