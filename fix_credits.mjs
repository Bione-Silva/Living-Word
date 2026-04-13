import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function addCredits() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  
  console.log("Checking profiles...");
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  
  console.log("Found", profiles?.length || 0, "profiles.");
  
  if (profiles && profiles.length > 0) {
    // Give everyone 10,000 credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: 10000, plan: 'master' })
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (updateError) {
      console.error("Error updating credits:", updateError);
    } else {
      console.log("Successfully added 10,000 credits and set plan to 'master' for all users.");
    }
  }
}

addCredits();
