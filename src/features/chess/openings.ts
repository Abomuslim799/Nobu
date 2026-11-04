/**
 * openings.ts — debyut nomi va nazariya (lichess chess-openings, CC0): pozitsiya → nom; nazariya yurishlari;
 * debyut mashqi uchun variantlar (King's Indian — qoralar bilan, Pirc: Austrian Attack — oqlar bilan).
 */

import { textHash } from '@/core/hash';
import data from '@content/chess/openings.json';

const D = data as unknown as { names: string[]; pos: Record<string, number>; moves: Record<string, string[]>; fam: Record<string, string[]> };
const key = (fen: string) => textHash(fen.split(' ').slice(0, 3).join(' '));

/** Shu pozitsiyaning debyut nomi (bo'lsa). */
export const openingName = (fen: string): string | null => { const i = D.pos[key(fen)]; return i === undefined ? null : D.names[i]; };
/** Nazariyadagi yurishlar (uci). */
export const bookMoves = (fen: string): string[] => D.moves[key(fen)] ?? [];

export interface Practice { id: 'kid' | 'austrian'; name: string; color: 'w' | 'b'; about: string }
export const PRACTICES: Practice[] = [
  { id: 'kid', name: "King's Indian", color: 'b', about: 'Qoralar bilan: 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6' },
  { id: 'austrian', name: 'Austrian Attack', color: 'w', about: 'Oqlar bilan Pirc ga qarshi: 1.e4 d6 2.d4 Nf6 3.Nc3 g6 4.f4' },
];
/** Mashqda bot nazariyani davom ettiradi: o'ynalgan yurishlar bilan boshlanadigan variantlardan keyingi yurish (bo'lmasa — null). */
export function practiceNext(id: Practice['id'], played: string[], rnd = Math.random): string | null {
  const pre = played.join(' ');
  const lines = (D.fam[id] ?? []).map((l) => l.split(' ')).filter((l) => l.length > played.length && l.slice(0, played.length).join(' ') === pre);
  if (!lines.length) return null;
  return lines[Math.floor(rnd() * lines.length)][played.length];
}
/** Foydalanuvchi hali nazariyadami (shu mashq variantlaridan birortasining boshida). */
export const inPractice = (id: Practice['id'], played: string[]) =>
  (D.fam[id] ?? []).some((l) => { const s = l.split(' '); return s.length >= played.length ? s.slice(0, played.length).join(' ') === played.join(' ') : played.slice(0, s.length).join(' ') === s.join(' '); });
