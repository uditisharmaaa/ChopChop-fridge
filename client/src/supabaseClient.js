import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rdlvfoifjdyvwkzhygbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbHZmb2lmamR5dndremh5Z2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTY5NjEsImV4cCI6MjA3NzE5Mjk2MX0.3HrwRA-Cah9o6EHoY3XyrIk22TNEKcupbSR6PnhCvX4';



export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  