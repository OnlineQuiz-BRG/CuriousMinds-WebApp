
import { createClient } from '@supabase/supabase-js';

// Accessing environment variables injected by Vite
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// A valid Supabase URL must start with https:// and not contain 'placeholder' or 'undefined'
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseKey && 
  supabaseUrl !== 'undefined' && 
  supabaseKey !== 'undefined' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://');

if (!isSupabaseConfigured) {
  console.warn(
    "Curious Minds: Running in Local/Offline mode. " +
    "Cloud features will be enabled once VITE_SUPABASE_URL is provided."
  );
}

// Fallback to a dummy URL if not configured. 
// We use a non-existent but valid URL format to satisfy the client constructor.
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://offline-mode.supabase.co', 'offline-key');
