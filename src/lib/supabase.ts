
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
// These should ideally be stored in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL") {
  console.warn("Supabase URL is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.warn("Supabase anon key is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
