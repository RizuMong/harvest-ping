const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekptznrtizjjqrkxpdxg.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_IByP-zt3XY045esqhIvxkw_EBYfqZK5';

const supabase = createClient(url, key);

async function check() {
  console.log("Checking user_devices...");
  const { data: devices, error: devError } = await supabase.from('user_devices').select('*').limit(2);
  if (devError) {
    console.error("user_devices error:", devError);
  } else {
    console.log("user_devices success! sample:", devices);
    if (devices.length > 0) {
      console.log("Columns:", Object.keys(devices[0]));
    }
  }

  console.log("\nChecking t_ping_reminder...");
  const { data: reminders, error: remError } = await supabase.from('t_ping_reminder').select('*').limit(2);
  if (remError) {
    console.error("t_ping_reminder error:", remError);
  } else {
    console.log("t_ping_reminder success! sample:", reminders);
    if (reminders.length > 0) {
      console.log("Columns:", Object.keys(reminders[0]));
    }
  }
}

check();
