/**
 * ai.ts — Miya bo'limi uchun AI: mantiqiy masalalar, shaxmat xatosi izohi, miya tahlili.
 */
import { api } from '@/core/server';

export interface LogicItem { q: string; options: string[]; answer: string; why: string }
/** Darajaga mos 6 ta mantiqiy masala (o'zbekcha, variantli, tushuntirish bilan). */
export async function logicSet(level: number): Promise<LogicItem[]> {
  const r = await api<{ items: LogicItem[] }>('/logic', { level });
  return r.items;
}

export interface ChessExplain { why_wrong_uz: string; idea_uz: string; tip_uz: string }
/** Shaxmat masalasidagi xato: nega yurish yomon, to'g'ri g'oya nima, keyingi safar nimaga qarash. */
export async function chessExplain(x: { fen: string; wrong: string; best: string[]; themes: string; rating: number }): Promise<ChessExplain> {
  return api('/chess-explain', x);
}

export interface BrainReport {
  summary_uz: string;
  skills: { skill: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[];
}
export async function brainReport(data: object): Promise<BrainReport> {
  return api('/brain-report', { data });
}
