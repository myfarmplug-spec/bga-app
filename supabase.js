import dotenv from "dotenv";
dotenv.config();
// Backend Supabase client — uses service role key to bypass RLS
// All writes happen server-side; the frontend uses the anon key for reads
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key (bypasses RLS) — fall back to anon key for local dev
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("[supabase] No key found — set SUPABASE_SERVICE_KEY in env");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export default supabase;
