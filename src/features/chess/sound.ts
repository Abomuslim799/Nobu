/**
 * sound.ts — shaxmat tovushlari: haqiqiy yog'och zarbalari (Kenney Impact Sounds, CC0 — assets/sounds/chess/LICENSE.md).
 *   move    — oddiy yurish (3 xil variant, tasodifiy — bir xil eshitilmasin)
 *   capture — dona olish (kuchliroq zarba)
 *   castle  — rokirovka (ikki zarba: shoh va ruh)
 *   check   — shax (og'ir zarba)
 *   mate    — mat (ikki og'ir zarba — o'yin tugadi)
 *   good / bad — masala yechildi / xato
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SRC = {
  move: [require('../../../assets/sounds/chess/move1.wav'), require('../../../assets/sounds/chess/move2.wav'), require('../../../assets/sounds/chess/move3.wav')],
  capture: [require('../../../assets/sounds/chess/capture1.wav'), require('../../../assets/sounds/chess/capture2.wav')],
  castle: [require('../../../assets/sounds/chess/castle.wav')],
  check: [require('../../../assets/sounds/chess/check.wav')],
  mate: [require('../../../assets/sounds/chess/mate.wav')],
  good: [require('../../../assets/sounds/chess/good.wav')],
  bad: [require('../../../assets/sounds/chess/bad.wav')],
} as const;
export type SoundKind = keyof typeof SRC;

let players: Partial<Record<SoundKind, AudioPlayer[]>> | null = null;
/** Tovushlarni oldindan yuklash — ekran ochilganda chaqiriladi (birinchi yurishda jim qolmasin). */
export function preloadSounds() {
  if (players) return players;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  players = {};
  for (const k of Object.keys(SRC) as SoundKind[]) {
    try { players[k] = SRC[k].map((s) => { const p = createAudioPlayer(s); p.volume = 1; return p; }); } catch { /* tovushsiz */ }
  }
  return players;
}
export function playSound(kind: SoundKind, on = true) {
  if (!on) return;
  const list = preloadSounds()[kind];
  if (!list?.length) return;
  const p = list[Math.floor(Math.random() * list.length)];
  try {
    if (p.playing || p.currentTime > 0) p.seekTo(0).then(() => p.play()).catch(() => p.play());
    else p.play();
  } catch { /* jim */ }
}
/** chess.js yurishidan tovush turi: mat → shax → rokirovka → olish → oddiy. */
export function moveSound(m: { flags: string; san: string }): SoundKind {
  if (m.san.includes('#')) return 'mate';
  if (m.san.includes('+')) return 'check';
  if (m.flags.includes('k') || m.flags.includes('q')) return 'castle';
  if (m.flags.includes('c') || m.flags.includes('e')) return 'capture';
  return 'move';
}
