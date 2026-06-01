const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('trx_finish_harvest')
    .insert({
      scheduler_id: 1,
      harvest_date: '2026-06-01',
      note: 'Test Note',
      status: 'submitted',
      user_id: 1
    })
    .select();

  console.log("Insert Data:", data);
  console.log("Insert Error:", error);
}
run();
