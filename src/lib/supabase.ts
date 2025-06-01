
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
// These should ideally be stored in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vpflahhfwnwvzphfrwnb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZmxhaGhmd253dnpwaGZyd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzEzNjQsImV4cCI6MjA2NDM0NzM2NH0.OC1TijrakZYIG-jEWm4JaR8SqPht0qg5BSNptQ5VaaM";

if (!supabaseUrl || supabaseUrl === "YOUR_SUPABASE_URL") {
  console.warn("Supabase URL is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey || supabaseAnonKey === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZmxhaGhmd253dnpwaGZyd25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzEzNjQsImV4cCI6MjA2NDM0NzM2NH0.OC1TijrakZYIG-jEWm4JaR8SqPht0qg5BSNptQ5VaaM") {
  console.warn("Supabase anon key is not configured. Please update src/lib/supabase.ts or set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
