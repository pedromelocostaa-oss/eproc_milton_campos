import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Fallback público — anon key é pública por design (protegida por RLS no Supabase).
// Env vars sobrescrevem quando existem (útil para dev local com outro projeto).
const FALLBACK_URL = 'https://pzcbvvqqzzvgifruvett.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Y2J2dnFxenp2Z2lmcnV2ZXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Mjc1MzEsImV4cCI6MjEwNDAwMzUzMX0.PDhovaKlZ2PBDCEhCMeBXerVxTjqhvzVmm7VZUmf4YU';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_ANON_KEY;

// Mantido para compatibilidade — todas as funções do store já usam Supabase
export const DEMO_MODE = true;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'eproc-sim-auth',
  },
});
