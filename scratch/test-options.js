const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function checkOptions(table) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: 'OPTIONS',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log(`OPTIONS ${table} status:`, res.status);
    const data = await res.json();
    console.log(`OPTIONS ${table} data:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error in OPTIONS ${table}:`, err);
  }
}

async function run() {
  await checkOptions('trx_finish_harvest');
}
run();
