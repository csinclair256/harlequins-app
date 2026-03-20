/**
 * appConfig.ts — Application-level configuration constants (R-09)
 *
 * Extracted by Qwen2.5-Coder 32B analysis from index.tsx module-level const (2026-03-20).
 * Centralises values that may need updating per season or client requirement.
 *
 * Future: consider sourcing PRIORITY_KEYWORDS from a Supabase config table
 * to allow admin updates without a redeploy (see LD-09).
 */

/**
 * Competition names containing these substrings are flagged as priority events
 * and receive the gold border / ★ PRIORITY EVENT badge in the schedule list.
 */
export const PRIORITY_KEYWORDS: readonly string[] = [
  'ADCC Oceania',
  'QJC States',
  'Australian National',
  'Pan Pac',
] as const;
