const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabase = createClient(url, key);

async function run() {
  const approvalLines = [
    { approverId: '2', approverName: 'Cindy Yolanda Octavia', status: 'Waiting' }
  ];
  const timeline = [
    { status: 'submitted', date: new Date().toISOString(), note: 'Test' }
  ];
  
  const { data, error } = await supabase
    .from('trx_finish_harvest')
    .insert({
      scheduler_id: 1,
      scheduler_title: 'Test Scheduler',
      harvest_date: '2026-06-01',
      note: 'Test Note',
      status: 'submitted',
      user_id: 1,
      user_name: 'Rizki Haddi Prayoga',
      approval_lines: approvalLines,
      timeline: timeline
    })
    .select();

  console.log("Insert Data:", data);
  console.log("Insert Error:", error);
}
run();
