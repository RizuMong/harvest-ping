const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function testCol(table, col) {
  const { data, error } = await supabase.from(table).select(col).limit(1);
  if (error && error.message.includes('column')) {
    // column not found
  } else if (error) {
    console.log(`${table} Column ${col}: ERROR: ${error.message}`);
  } else {
    console.log(`${table} Column ${col}: YES`);
  }
}

async function run() {
  const roleCols = ['id', 'created_at', 'role_name', 'name', 'code', 'updated_at'];
  const posCols = ['id', 'created_at', 'position_name', 'name', 'code', 'updated_at'];
  
  for (const c of roleCols) {
    await testCol('master_role', c);
  }
  for (const c of posCols) {
    await testCol('master_position', c);
  }
}
run();
