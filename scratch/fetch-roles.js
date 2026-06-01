const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: roles } = await supabase.from('master_role').select('*');
  console.log("Roles:", roles);
  const { data: positions } = await supabase.from('master_position').select('*');
  console.log("Positions:", positions);
}
run();
