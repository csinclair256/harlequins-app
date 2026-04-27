/**
 * feedback.ts — Haptic + Audio feedback utility
 *
 * Implements iOS-style tactile response for the Harlequins Staff App.
 * - Haptics: expo-haptics (native) / Web Vibration API (web/Android)
 * - Audio:   Web Audio API synthesis — 50ms high-freq click, no asset file needed
 * - Settings: persisted to localStorage (web) / in-memory (native)
 *
 * Note: iOS Safari does NOT support the Web Vibration API. Audio click fires on
 * all platforms. Android Chrome supports both vibration + audio.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// ─── Settings ────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'hq_feedback_enabled';

export function getFeedbackEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(SETTINGS_KEY) !== 'false';
}

export function setFeedbackEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, String(enabled));
  }
}

// ─── Haptics ─────────────────────────────────────────────────────────────────

/** Light impact — Register / positive action buttons */
export function triggerHapticLight(): void {
  if (!getFeedbackEnabled()) return;
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return;
  }
  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
    window.navigator.vibrate(10);
  }
}

/** Heavy impact — Error / Low Stock alerts */
export function triggerHapticHeavy(): void {
  if (!getFeedbackEnabled()) return;
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    return;
  }
  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
    window.navigator.vibrate([20, 50, 20]);
  }
}

// ─── Audio ───────────────────────────────────────────────────────────────────

let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume suspended context (required after browser autoplay policy)
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

/**
 * playFeedback — synthesises a 50ms high-frequency click mimicking the
 * iOS keyboard/lock sound. No asset file required.
 */
export function playFeedback(): void {
  if (!getFeedbackEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // High-freq sine sweep: 1200 → 800 Hz over 50ms — mimics iOS tock
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Silently fail if AudioContext unavailable
  }
}
