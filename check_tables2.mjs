import { createClient } from '@supabase/supabase-js';

const url = "https://osusqcbyybfuwdewvbai.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXNxY2J5eWJmdXdkZXd2YmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzMxNDksImV4cCI6MjA5MDgwOTE0OX0.j-_U1JKVA5ypFn-6beMqOrRTgswdl1L7-SRn6RTv5GQ";

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('content_library').select('id').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("content_library exists here!");
  }
}

check();
