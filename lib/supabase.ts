import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseApiKey = process.env.EXPO_PUBLIC_SUPABASE_API_KEY;

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL');
}

if (!supabaseApiKey) {
  throw new Error('Missing required environment variable: EXPO_PUBLIC_SUPABASE_API_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseApiKey);
