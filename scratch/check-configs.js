const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function check(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    if (error.message.includes('cache')) {
      // not found
    } else {
      console.log(`Table ${table} error:`, error.message);
    }
  } else {
    console.log(`Table ${table} success! Columns:`, Object.keys(data[0] || {}));
  }
}

async function run() {
  const tables = [
    'master_configuration',
    't_ping_configuration',
    't_ping_approver_configuration',
    'master_approver_configuration',
    't_ping_harvest_approver',
    'master_harvest_approver',
    't_ping_harvest_approver_config',
    'master_harvest_approver_config',
    't_harvest_approver_config',
    'master_harvest_config'
  ];
  for (const t of tables) {
    await check(t);
  }
}
run();
