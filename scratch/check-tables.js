const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function check(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    console.log(`Table ${table} error:`, error.message);
  } else {
    console.log(`Table ${table} success! Columns:`, Object.keys(data[0] || {}));
  }
}

async function run() {
  const tables = [
    't_ping_approver',
    't_ping_approver_config',
    'master_approver',
    't_approver_config',
    'approver_config',
    'master_approver_config',
    't_ping_config',
    'master_config',
    't_ping_finish_harvest_approver'
  ];
  for (const t of tables) {
    await check(t);
  }
}
run();
