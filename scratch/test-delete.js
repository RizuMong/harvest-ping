const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekptznrtizjjqrkxpdxg.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_IByP-zt3XY045esqhIvxkw_EBYfqZK5';

const supabase = createClient(url, key);

async function testDelete() {
  console.log("Testing Supabase delete...");
  try {
    // 1. Insert dummy row
    const { data: insertData, error: insertError } = await supabase
      .from('t_ping_scheduller')
      .insert({
        title: 'Test Delete Row',
        message: 'This is a test delete row',
        status: 'active'
      })
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }
    
    console.log("Inserted row:", insertData);
    const idToDelete = insertData[0].id;

    // 2. Try to delete it
    const { error: deleteError } = await supabase
      .from('t_ping_scheduller')
      .delete()
      .eq('id', idToDelete);

    if (deleteError) {
      console.error("Delete error:", deleteError);
    } else {
      console.log("Delete successful!");
    }
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

testDelete();
