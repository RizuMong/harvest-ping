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
    'master_role',
    'master_position',
    'master_setting',
    't_ping_setting',
    'master_config',
    't_ping_config',
    't_ping_approver',
    'master_approver',
    't_approver',
    'approver',
    't_ping_approval',
    'master_approval',
    't_ping_scheduller',
    'trx_finish_harvest'
  ];
  for (const t of tables) {
    await check(t);
  }
}
run();
