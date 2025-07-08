'use client';

import { createClient } from '@supabase/supabase-js';
import { DatabaseNote } from './types';

// Database type definition
export interface Database {
    public: {
        Tables: {
            cardrail_notes: {
                Row: DatabaseNote;
                Insert: Omit<DatabaseNote, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<DatabaseNote, 'id' | 'created_at'>>;
            };
            cardrail_users: {
                Row: {
                    id: string;
                    passphrase: string;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    passphrase: string;
                };
                Update: {
                    passphrase?: string;
                };
            };
        };
    };
}

// Supabase client instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
