import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DEBUGGING: Print these to the browser console to see what Vercel is actually using
if (typeof window !== 'undefined') {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key Length:", supabaseKey ? supabaseKey.length : "MISSING");
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is missing!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);