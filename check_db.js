const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://priumwdestycikzfcysg.supabase.co', 'cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==');

async function check() {
  const { data: events, error: e1 } = await supabase.from('stripe_events').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("LAST 5 STRIPE EVENTS:");
  console.log(events ? events.map(e => `${e.type} - ${JSON.stringify(e.payload).substring(0, 100)}`) : e1);

  const { data: profiles, error: e2 } = await supabase.from('profiles').select('id, email, plan, credits_remaining, subscription_status, stripe_customer_id').limit(5);
  console.log("\nPROFILES:");
  console.log(profiles ? profiles : e2);
}
check();
