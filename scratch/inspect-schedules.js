const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekptznrtizjjqrkxpdxg.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_IByP-zt3XY045esqhIvxkw_EBYfqZK5';

const supabase = createClient(url, key);

async function inspect() {
  try {
    const { data: schedulers } = await supabase.from('t_ping_scheduller').select('id, title, status');
    console.log("Schedulers in DB:", schedulers);

    const { data: trxs } = await supabase.from('trx_finish_harvest').select('id, scheduler_id, status');
    console.log("Finish Harvest Trx in DB:", trxs);
  } catch (err) {
    console.error(err);
  }
}

inspect();
