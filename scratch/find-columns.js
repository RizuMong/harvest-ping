const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function testCol(col) {
  const { data, error } = await supabase.from('trx_finish_harvest').select(col).limit(1);
  if (error && error.message.includes('column')) {
    console.log(`Column ${col}: NO`);
  } else if (error) {
    console.log(`Column ${col}: ERROR: ${error.message}`);
  } else {
    console.log(`Column ${col}: YES`);
  }
}

async function run() {
  const columns = [
    'id', 'created_at', 'scheduler_id', 'scheduler_title', 'harvest_date', 'note',
    'status', 'approval_lines', 'timeline', 'user_id', 'user_name', 'created_by', 'updated_by',
    'updated_at', 'approver_id', 'remarks'
  ];
  for (const c of columns) {
    await testCol(c);
  }
}
run();
