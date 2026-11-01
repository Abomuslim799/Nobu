/**
 * ai.ts — Nobu (shaxsiy yordamchi) va Ustoz suhbati: matnli suhbat va umumiy tahlil.
 */
import { api } from '@/core/server';

export interface TutorMsg { role: 'user' | 'nobu'; text: string }
/** Nobu bilan matnli suhbat (dars yoki statistika konteksti bilan). */
export async function nobuChat(topic: string, ctx: string, history: TutorMsg[]): Promise<string> {
  const r = await api<{ reply: string }>('/tutor', { topic, ctx,
    history: history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })) });
  return r.reply;
}

export interface Overview {
  summary_uz: string; areas: { area: string; comment_uz: string }[];
  strengths_uz: string[]; weaknesses_uz: string[]; plan_uz: string[];
}
export async function nobuOverview(data: object): Promise<Overview> {
  return api('/overview', { data });
}
