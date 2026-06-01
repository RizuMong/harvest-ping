const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function getColumns(table) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?limit=0`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'text/csv'
      }
    });
    const csv = await res.text();
    console.log(`Table ${table} columns:`, csv.trim().split('\n')[0]);
  } catch (err) {
    console.error(`Error getting columns for ${table}:`, err);
  }
}

async function run() {
  await getColumns('trx_finish_harvest');
  await getColumns('master_user');
  await getColumns('t_ping_scheduller');
  await getColumns('master_role');
  await getColumns('master_position');
}
run();
