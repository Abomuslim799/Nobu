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

async function post<T>(path: string, body: object): Promise<T> {
  const cfg = await getConfig();
  if (!cfg) throw new Error("Server ulanmagan: Statistika → 🔗 Server (widget + AI) bo'limini to'ldiring");
  const r = await fetch(`${cfg.url}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
