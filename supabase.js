import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Base URL for Supabase Edge Functions. */
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;

/** Public URL for competition images in Storage (no Smoothcomp). */
export const competitionImagesStorageUrl = `${supabaseUrl}/storage/v1/object/public/competition-images`;