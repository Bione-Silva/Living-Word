const https = require('https');

const SUPABASE_APP_URL = 'priumwdestycikzfcysg.supabase.co';
const ANON_KEY = 'cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==';

const options = {
  hostname: SUPABASE_APP_URL,
  path: '/rest/v1/stripe_events?select=*&order=created_at.desc&limit=5',
  method: 'GET',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(body);
  });
});
req.end();
