import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Voter {
  id: string;
  voter_id: string;
  name: string;
  department: string;
  year: number;
  wallet_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VoteRecord {
  id: string;
  voter_id: string;
  tx_hash: string;
  block_number: number;
  created_at: string;
}