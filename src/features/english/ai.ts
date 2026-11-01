/**
 * ai.ts — ingliz tili uchun AI (server orqali, Gemini): talaffuz bahosi, Writing tekshiruvi,
 * yangi grammatika mashqlari, ko'nikmalar tahlili.
 */
import { api } from '@/core/server';

export interface WrongWord { word: string; heard: string; tip_uz: string }
export interface ShadowResult {
  transcript: string; accuracy: number; wrong_words: WrongWord[]; stress_uz: string; feedback_uz: string;
}
export interface Correction { wrong: string; right: string; why_uz: string }
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

export async function shadowScore(uri: string, target: string): Promise<ShadowResult> {
  return api('/speak', { mode: 'shadow', audio: await toBase64(uri), mime: 'audio/mp4', target });
}

export async function writeCheck(task: string, text: string, level: string, words: string[]): Promise<WriteResult> {
  return api('/write', { task, text, level, words });
}

export interface GrammarItem { q: string; options: string[]; answer: string; why: string }
/** Mavzu bo'yicha 10 ta yangi grammatika mashqi (AI yaratadi). */
export async function grammarSet(topic: string, level: string, avoid: string[]): Promise<GrammarItem[]> {
  const r = await api<{ exercises: GrammarItem[] }>('/grammar', { topic, level, avoid });
  return r.exercises;
}

export interface SkillsReport {
  level: string;
  skills: { skill: string; level: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[]; summary_uz: string;
}
/** Barcha mashqlar tarixi bo'yicha AI tahlil: daraja, kuchli/zaif tomonlar, 2 haftalik reja. */
export async function skillsReport(skills: object): Promise<SkillsReport> {
  return api('/report', { skills });
}
