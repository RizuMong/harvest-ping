const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekptznrtizjjqrkxpdxg.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_IByP-zt3XY045esqhIvxkw_EBYfqZK5';

const supabase = createClient(url, key);

async function test() {
  console.log("Inspecting Supabase tables...");
  try {
    const { data: schedulers, error: schError } = await supabase
      .from('t_ping_scheduller')
      .select('*')
      .limit(2);

    if (schError) {
      console.error("t_ping_scheduller error:", schError);
    } else {
      console.log("t_ping_scheduller cols:", Object.keys(schedulers[0] || {}));
      console.log("t_ping_scheduller sample:", schedulers);
    }

    const { data: users, error: userError } = await supabase
      .from('master_user')
      .select('*')
      .limit(2);

    if (userError) {
      console.error("master_user error:", userError);
    } else {
      console.log("master_user cols:", Object.keys(users[0] || {}));
      console.log("master_user sample:", users);
    }

    // Inspect columns of trx_finish_harvest by inserting a dummy or selecting
    const { data: trx, error: trError } = await supabase
      .from('trx_finish_harvest')
      .select('*')
      .limit(1);
    
    if (trError) {
      console.error("trx_finish_harvest error:", trError);
    } else {
      console.log("trx_finish_harvest cols:", Object.keys(trx[0] || {}));
    }
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

test();
