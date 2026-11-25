/**
 * scenes.ts — komiks darslar (mavzu id → sahnalar). Sof inglizcha; subtitr faqat qiyin joyda.
 *   Past simple — nuqta (tugagan), past continuous — chiziq (fon), ikkalasi birga — chiziq ustida nuqta.
 */

import type { Scene, Shot } from '@/features/english/comic/types';

const SKY = '#DCEBFA', GROUND = '#F4EFE6', DARK = '#2A2230';

// ── Sahna 1: Dinosaurs died out (past simple — o'tmishdagi nuqta) ──────────────
const dinoDied: Shot[] = [
  {
    bg: SKY, ms: 420, loops: 3, caption: '66 million years ago…', say: 'Sixty-six million years ago…',
    frames: [
      [{ e: '☀️', x: 0.85, y: 0.16, s: 0.14 }, { e: '🌴', x: 0.12, y: 0.62, s: 0.22 }, { e: '🦖', x: 0.38, y: 0.72, s: 0.26, flip: true }, { e: '🦕', x: 0.72, y: 0.7, s: 0.28 }],
      [{ e: '☀️', x: 0.85, y: 0.16, s: 0.15 }, { e: '🌴', x: 0.12, y: 0.62, s: 0.22, r: -3 }, { e: '🦖', x: 0.39, y: 0.7, s: 0.26, flip: true }, { e: '🦕', x: 0.71, y: 0.71, s: 0.28 }],
    ],
    bubble: { text: 'Life is good!', x: 0.36, y: 0.38 },
  },
  {
    bg: SKY, ms: 260, loops: 1, sfx: 'whoosh', fx: ['speed'], hold: 300,
    frames: [
      [{ e: '☄️', x: 0.9, y: 0.08, s: 0.14 }, { e: '🦖', x: 0.38, y: 0.72, s: 0.26, flip: true }, { e: '🦕', x: 0.72, y: 0.7, s: 0.28 }],
      [{ e: '☄️', x: 0.78, y: 0.2, s: 0.18 }, { e: '🦖', x: 0.38, y: 0.72, s: 0.26, flip: true }, { e: '❗', x: 0.4, y: 0.48, s: 0.1 }, { e: '🦕', x: 0.72, y: 0.7, s: 0.28 }],
      [{ e: '☄️', x: 0.66, y: 0.3, s: 0.22 }, { e: '🦖', x: 0.38, y: 0.72, s: 0.26, flip: true }, { e: '❗', x: 0.4, y: 0.46, s: 0.12 }, { e: '🦕', x: 0.72, y: 0.7, s: 0.28 }, { e: '❓', x: 0.76, y: 0.46, s: 0.1 }],
    ],
  },
  {
    bg: GROUND, ms: 300, loops: 2, fx: ['speed'],
    frames: [
      [{ e: '🦖', x: 0.5, y: 0.6, s: 0.55 }],
      [{ e: '😱', x: 0.5, y: 0.58, s: 0.5 }],
    ],
    bubble: { text: 'Oops.', x: 0.72, y: 0.2 }, say: 'Oops.',
  },
  {
    bg: '#FFE08A', ms: 140, loops: 4, sfx: 'boom', fx: ['impact', 'shake'], hold: 400,
    frames: [
      [{ e: '💥', x: 0.5, y: 0.55, s: 0.6 }],
      [{ e: '💥', x: 0.5, y: 0.55, s: 0.75, r: 12 }],
    ],
    sound: { text: 'BOOM!!', x: 0.5, y: 0.16 },
  },
  {
    bg: DARK, ms: 600, loops: 2, hold: 1800,
    frames: [
      [{ e: '🦴', x: 0.35, y: 0.72, s: 0.16 }, { e: '🦴', x: 0.6, y: 0.75, s: 0.14, r: 40 }, { e: '💨', x: 0.5, y: 0.45, s: 0.2 }],
      [{ e: '🦴', x: 0.35, y: 0.72, s: 0.16 }, { e: '🦴', x: 0.6, y: 0.75, s: 0.14, r: 40 }, { e: '💨', x: 0.53, y: 0.4, s: 0.16 }],
    ],
    timeline: { kind: 'point', at: 0.2, label: '66 million years ago' },
    sentence: { text: 'Dinosaurs died out 66 million years ago.', hi: ['died'] },
    say: 'Dinosaurs died out sixty-six million years ago.',
    caption: 'Finished. One point in the past.',
    sub: "Tugagan voqea, aniq o'tgan vaqt → past simple",
  },
];

// ── Sahna 2: was eating … when … hit (chiziq + nuqta) ─────────────────────────
const dinoEating: Shot[] = [
  {
    bg: SKY, ms: 300, loops: 4,
    frames: [
      [{ e: '🦖', x: 0.42, y: 0.68, s: 0.34, flip: true }, { e: '🍖', x: 0.68, y: 0.74, s: 0.14 }],
      [{ e: '🦖', x: 0.45, y: 0.7, s: 0.34, flip: true, r: 8 }, { e: '🍖', x: 0.66, y: 0.75, s: 0.13, r: -15 }],
    ],
    bubble: { text: 'Nom nom nom…', x: 0.3, y: 0.3 }, say: 'The T. rex was eating his lunch…',
    timeline: { kind: 'line', at: 0.55, from: 0.15, label: 'was eating' },
    caption: 'An action in progress…',
  },
  {
    bg: '#FFE08A', ms: 140, loops: 4, sfx: 'boom', fx: ['impact', 'shake'], hold: 300,
    frames: [
      [{ e: '☄️', x: 0.55, y: 0.35, s: 0.3 }, { e: '🦖', x: 0.42, y: 0.72, s: 0.3, flip: true }],
      [{ e: '💥', x: 0.5, y: 0.55, s: 0.7 }],
    ],
    sound: { text: 'BONK!', x: 0.5, y: 0.14 },
    say: '…when the asteroid hit.',
    timeline: { kind: 'line+point', at: 0.55, from: 0.15, label: 'hit' },
    caption: '…and something interrupted it.',
  },
  {
    bg: GROUND, ms: 700, loops: 1, hold: 2600,
    frames: [[{ e: '🍖', x: 0.5, y: 0.6, s: 0.22 }, { e: '💨', x: 0.3, y: 0.55, s: 0.14 }]],
    timeline: { kind: 'line+point', at: 0.55, from: 0.15, label: 'hit' },
    sentence: { text: 'He was eating when the asteroid hit.', hi: ['was eating', 'hit'] },
    say: 'He was eating when the asteroid hit.',
    caption: 'Long action = was + -ing. Short action = past simple.',
    sub: "Uzun fon → was eating; uni bo'lgan qisqa voqea → hit",
  },
];

export const SCENES: Record<string, Scene[]> = {
  'past-simple-cont': [
    { id: 'dino-died', title: 'The end of the dinosaurs', shots: dinoDied },
    { id: 'dino-eating', title: 'Lunch interrupted', shots: dinoEating },
  ],
};

export const scenesOf = (topic: string) => SCENES[topic] ?? [];
