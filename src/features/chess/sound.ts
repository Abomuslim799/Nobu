/**
 * sound.ts — shaxmat tovushlari (o'zimiz yasaganmiz, litsenziyasiz): yurish, olish, rokirovka, shax, to'g'ri, xato.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SRC = {
  move: require('../../../assets/sounds/chess/move.wav'),
  capture: require('../../../assets/sounds/chess/capture.wav'),
  castle: require('../../../assets/sounds/chess/castle.wav'),
  check: require('../../../assets/sounds/chess/check.wav'),
  good: require('../../../assets/sounds/chess/good.wav'),
  bad: require('../../../assets/sounds/chess/bad.wav'),
} as const;
export type SoundKind = keyof typeof SRC;

let players: Partial<Record<SoundKind, AudioPlayer>> | null = null;
/** Tovushlarni oldindan yuklash — ekran ochilganda chaqiriladi (birinchi yurishda jim qolmasin). */
export function preloadSounds() {
  if (players) return players;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  players = {};
  for (const k of Object.keys(SRC) as SoundKind[]) { try { players[k] = createAudioPlayer(SRC[k]); } catch { /* tovushsiz */ } }
  return players;
}
export function playSound(kind: SoundKind, on = true) {
  if (!on) return;
  const p = preloadSounds()[kind];
  if (!p) return;
  try {
    if (p.playing || p.currentTime > 0) p.seekTo(0).then(() => p.play()).catch(() => p.play());
    else p.play();
  } catch { /* jim */ }
}
/** chess.js yurishidan tovush turi. */
export function moveSound(m: { flags: string; san: string }): SoundKind {
  if (m.san.includes('+') || m.san.includes('#')) return 'check';
  if (m.flags.includes('k') || m.flags.includes('q')) return 'castle';
  if (m.flags.includes('c') || m.flags.includes('e')) return 'capture';
  return 'move';
}
