/**
 * ai.ts — Gemini bilan ishlash (Railway serveri orqali, kalit serverda).
 *   shadowScore — gapni talaffuzini baholash (aniqlik %, xato so'zlar, urg'u)
 *   chatTurn    — film mavzusida ovozli suhbat: siz gapirasiz, u javob beradi va xatolarni tuzatadi
 *   writeCheck  — Writing matnini tekshirish (daraja, tuzatishlar, yaxshiroq variant)
 * Server manzili va token — Statistika → "Server" kartasidan (sync.ts bilan bir xil).
 */

import { getConfig } from './sync';

export interface WrongWord { word: string; heard: string; tip_uz: string }
export interface ShadowResult {
  transcript: string; accuracy: number; wrong_words: WrongWord[]; stress_uz: string; feedback_uz: string;
}
export interface Correction { wrong: string; right: string; why_uz: string }
export interface ChatResult { transcript: string; reply: string; corrections: Correction[]; pronunciation_uz: string }
export interface ChatMsg { role: 'user' | 'ai'; text: string }
export interface WriteResult { level: string; score: number; corrections: Correction[]; better: string; feedback_uz: string }

/** Telefondagi ovoz faylini base64 ga o'giradi (fetch + FileReader — qo'shimcha kutubxonasiz). */
async function toBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error("Ovoz faylini o'qib bo'lmadi"));
    r.readAsDataURL(blob);
  });
}

async function post<T>(path: string, body: object, timeoutMs = 150_000): Promise<T> {
  const cfg = await getConfig();
  if (!cfg) throw new Error("Server ulanmagan: Statistika → 🔗 Server (widget + AI) bo'limini to'ldiring");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  let r: Response;
  try {
    r = await fetch(`${cfg.url}${path}`, {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(ctl.signal.aborted ? "AI juda uzoq javob bermadi — qayta urinib ko'ring" : "Serverga ulanib bo'lmadi (internet?)");
  } finally {
    clearTimeout(t);
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d as T;
}

export async function shadowScore(uri: string, target: string): Promise<ShadowResult> {
  return post('/api/nobu/speak', { mode: 'shadow', audio: await toBase64(uri), mime: 'audio/mp4', target });
}

export async function chatTurn(uri: string, history: ChatMsg[], movie: string, words: string[]): Promise<ChatResult> {
  return post('/api/nobu/speak', {
    mode: 'chat', audio: await toBase64(uri), mime: 'audio/mp4', movie, words,
    history: history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
  });
}

export async function writeCheck(task: string, text: string, level: string, words: string[]): Promise<WriteResult> {
  return post('/api/nobu/write', { task, text, level, words });
}

export interface GrammarItem { q: string; options: string[]; answer: string; why: string }
/** Mavzu bo'yicha 10 ta yangi grammatika mashqi (AI yaratadi). */
export async function grammarSet(topic: string, level: string, avoid: string[]): Promise<GrammarItem[]> {
  const r = await post<{ exercises: GrammarItem[] }>('/api/nobu/grammar', { topic, level, avoid });
  return r.exercises;
}

export interface SkillsReport {
  level: string;
  skills: { skill: string; level: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[]; summary_uz: string;
}
/** Barcha mashqlar tarixi bo'yicha AI tahlil: daraja, kuchli/zaif tomonlar, 2 haftalik reja. */
export async function skillsReport(skills: object): Promise<SkillsReport> {
  return post('/api/nobu/report', { skills });
}

// ── Miya bo'limi ──────────────────────────────────────────────────────────────
export interface LogicItem { q: string; options: string[]; answer: string; why: string }
/** Darajaga mos 6 ta mantiqiy masala (o'zbekcha, variantli, tushuntirish bilan). */
export async function logicSet(level: number): Promise<LogicItem[]> {
  const r = await post<{ items: LogicItem[] }>('/api/nobu/logic', { level });
  return r.items;
}

export interface ChessExplain { why_wrong_uz: string; idea_uz: string; tip_uz: string }
/** Shaxmat masalasidagi xato: nega yurish yomon, to'g'ri g'oya nima, keyingi safar nimaga qarash. */
export async function chessExplain(x: { fen: string; wrong: string; best: string[]; themes: string; rating: number }): Promise<ChessExplain> {
  return post('/api/nobu/chess-explain', x);
}

export interface BrainReport {
  summary_uz: string;
  skills: { skill: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[];
}
export async function brainReport(data: object): Promise<BrainReport> {
  return post('/api/nobu/brain-report', { data });
}

// ── Nobu — shaxsiy yordamchi ─────────────────────────────────────────────────
export interface TutorMsg { role: 'user' | 'nobu'; text: string }
/** Nobu bilan matnli suhbat (dars yoki statistika konteksti bilan). */
export async function nobuChat(topic: string, ctx: string, history: TutorMsg[]): Promise<string> {
  const r = await post<{ reply: string }>('/api/nobu/tutor', { topic, ctx,
    history: history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })) });
  return r.reply;
}

export interface Overview {
  summary_uz: string; areas: { area: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[];
}
export async function nobuOverview(data: object): Promise<Overview> {
  return post('/api/nobu/overview', { data });
}
