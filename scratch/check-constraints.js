const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('get_constraints', { table_name: 'user_devices' }).select('*');
  console.log("Constraints:", { data, error });
  
  // Or just query the system catalog if RPC doesn't exist
  const { data: queryData, error: queryError } = await supabase.from('user_devices').select('*');
  console.log("All devices:", queryData);
}
check();
