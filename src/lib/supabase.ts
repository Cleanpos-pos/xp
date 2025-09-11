
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
// These should ideally be stored in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nfscekqqsbbwysttugbl.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mc2Nla3Fxc2Jid3lzdHR1Z2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTk4MzAsImV4cCI6MjA2MTA5NTgzMH0.5QbUlWEZFw2c64QVXzEnuOPVpduBSqp6LQGxGigu87Y";

if (!supabaseUrl || supabaseUrl === "http://localhost:54321") {
  console.warn("Supabase URL is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
  console.warn("Supabase anon key is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
