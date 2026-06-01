const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function run() {
  const res = await fetch(`${url}/rest/v1/trx_finish_harvest`, {
    method: 'OPTIONS',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  console.log("Status:", res.status);
  for (const [k, v] of res.headers.entries()) {
    console.log(`${k}: ${v}`);
  }
}
run();
