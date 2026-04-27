/**
 * supabaseClient.ts — Hardened, typed Supabase client (R-01)
 *
 * Replaces: supabase.js (root)
 * Deploy to: source root alongside app/ (import path: '../../supabaseClient')
 *
 * Qwen2.5-Coder 32B analysis (2026-03-20):
 *   - All Competition fields except id are nullable in practice
 *   - createClient called with undefined args if env vars absent — hard guard added
 *   - supabaseFunctionsUrl and competitionImagesStorageUrl derived from validated URL
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// ─── Environment guard ────────────────────────────────────────────────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[supabaseClient] EXPO_PUBLIC_SUPABASE_URL is not defined. ' +
    'Copy .env.example to .env and populate the required values.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    '[supabaseClient] EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. ' +
    'Copy .env.example to .env and populate the required values.'
  );
}

// ─── Database schema ──────────────────────────────────────────────────────────
// Inferred by Qwen2.5-Coder 32B from competition fetch usage in app/(tabs)/index.tsx.
// Expand with additional tables as the schema grows.

export interface Competition {
  id: number;
  event_name: string | null;
  event_date: string | null;   // ISO date string e.g. '2026-04-12'
  location: string | null;
  event_image_url: string | null;
  web_address: string | null;
  registration_fees: string | null; // JSON string: { phases: RegPhase[] } or legacy text
}

export interface Database {
  public: {
    Tables: {
      competitions: {
        Row: Competition;
        Insert: Omit<Competition, 'id'>;
        Update: Partial<Omit<Competition, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

// ─── Typed client ─────────────────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ─── Derived URLs ─────────────────────────────────────────────────────────────
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
export const competitionImagesStorageUrl =
  `${supabaseUrl}/storage/v1/object/public/competition-images`;
