const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('master_user').select('*');
  console.log("Users:", data);
  console.log("Error:", error);
}
run();
