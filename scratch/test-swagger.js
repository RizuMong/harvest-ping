const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function run() {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': key
    }
  });
  console.log("Status:", response.status);
  const data = await response.json();
  console.log("rest/v1/ response:", data);
}
run();
