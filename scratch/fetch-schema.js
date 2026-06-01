const fetch = require('node-fetch');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekptznrtizjjqrkxpdxg.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_IByP-zt3XY045esqhIvxkw_EBYfqZK5';

async function getSwagger() {
  console.log("Fetching schema definition from PostgREST...");
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const swagger = await res.json();
    
    // Find t_ping_scheduller, trx_finish_harvest, master_user schema
    const paths = Object.keys(swagger.paths || {});
    console.log("Available paths/tables:", paths);

    const definitions = swagger.definitions || {};
    console.log("\nt_ping_scheduller definition:");
    console.log(definitions.t_ping_scheduller);

    console.log("\ntrx_finish_harvest definition:");
    console.log(definitions.trx_finish_harvest);

    // Let's search if there's any approval config table
    const approvalTables = Object.keys(definitions).filter(k => k.toLowerCase().includes('approval') || k.toLowerCase().includes('config'));
    console.log("\nMatching approval or config tables:", approvalTables);
    for (const t of approvalTables) {
      console.log(`\nTable ${t} definition:`);
      console.log(definitions[t]);
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

getSwagger();
