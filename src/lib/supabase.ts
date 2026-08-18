import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Delegate = {
  id: string;
  name: string;
  email: string;
  school: string;
  phone: string;
  experience: string | null;
  is_ambitus_student: boolean;
  preference_1_committee: string;
  preference_1_country: string;
  preference_2_committee: string;
  preference_2_country: string;
  preference_3_committee: string;
  preference_3_country: string;
  assigned_committee: string | null;
  assigned_country: string | null;
  assigned_matrix_id: string | null;
  allocation_type: string | null;
  registration_status: string;
  payment_proof_url: string | null;
  payment_status: string;
  created_at: string;
};

export type MatrixSlot = {
  id: string;
  committee: string;
  country: string;
  is_assigned: boolean;
  created_at: string;
};

export type Committee = {
  name: string;
  fullName: string;
  agenda: string;
  executiveBoard: { name: string; role: string }[];
  studyGuideUrl: string;
  description: string;
};
