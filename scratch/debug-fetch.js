const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function run() {
  const res = await fetch(`${url}/rest/v1/trx_finish_harvest?limit=0`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Accept': 'text/csv'
    }
  });
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Response text:", JSON.stringify(text));
}
run();
