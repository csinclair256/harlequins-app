/**
 * resolveImageUrl.ts — Competition image URL resolution utility (R-03)
 *
 * Extracted by Qwen2.5-Coder 32B from app/(tabs)/index.tsx renderItem inline IIFE (2026-03-20).
 * Eliminates LD-02: complex 3-branch ternary nested inside renderItem.
 *
 * Deploy to: source/utils/resolveImageUrl.ts
 * Update index.tsx import: import { resolveImageUrl } from '../../utils/resolveImageUrl';
 */

/**
 * Resolves a raw competition image value to a fully-qualified URL for use with expo-image.
 *
 * Branch logic:
 *   1. Null / empty  → returns '' (ThumbnailWithFallback renders Trophy placeholder)
 *   2. No 'http' prefix → relative storage path; prepends the public competition-images bucket URL
 *   3. Contains '/storage/v1/object/public/' → already a fully-qualified Supabase Storage URL; use as-is
 *   4. External URL (e.g. Smoothcomp) → proxied through the Supabase Edge Function to avoid CORS/hotlink blocks
 *
 * @param rawUrl      Raw value from competitions.event_image_url (may be null)
 * @param functionsUrl  Base URL for Supabase Edge Functions  (supabaseFunctionsUrl)
 * @param storageUrl    Public base URL for competition-images bucket (competitionImagesStorageUrl)
 * @returns Resolved URL string, or '' if no image is available
 */
export function resolveImageUrl(
  rawUrl: string | null,
  functionsUrl: string,
  storageUrl: string,
): string {
  if (!rawUrl) {
    return '';
  }
  if (!rawUrl.startsWith('http')) {
    // Relative storage path — prepend public bucket URL
    return `${storageUrl}/${rawUrl}`;
  }
  if (rawUrl.includes('/storage/v1/object/public/')) {
    // Already a fully-qualified Supabase Storage URL
    return rawUrl;
  }
  // External image — route through Edge Function proxy
  return `${functionsUrl}/proxy-image?url=${encodeURIComponent(rawUrl)}`;
}
