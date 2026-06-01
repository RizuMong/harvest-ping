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
    't_ping_approver_sequence',
    'master_approver_sequence',
    't_ping_finish_harvest_approver',
    'trx_finish_harvest_approver_config',
    'master_finish_harvest_approver',
    'master_approver_finish_harvest',
    't_finish_harvest_approver',
    't_ping_approvers',
    'master_approvers',
    't_ping_approval_lines',
    'master_approval_lines',
    't_ping_approver_configs',
    'master_approver_configs'
  ];
  for (const t of tables) {
    await check(t);
  }
}
run();
