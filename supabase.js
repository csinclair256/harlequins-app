import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Mac Studio IP: 192.168.50.243
export const supabaseUrl = 'http://192.168.50.243:54321'; 

// Use the Publishable key from your status output
const supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Base URL for Supabase Edge Functions. */
export const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;

/** Public URL for competition images in Storage (no Smoothcomp). */
export const competitionImagesStorageUrl = `${supabaseUrl}/storage/v1/object/public/competition-images`;