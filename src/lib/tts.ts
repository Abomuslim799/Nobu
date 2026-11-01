/**
 * tts.ts — Ustoz ovozi (Gemini, Iapetus) serverdan: matn → mp3 manzili. Server yasagan faylni keshlaydi,
 * ilova esa manzilni telefonda eslab qoladi — ikkinchi marta darhol chaladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { textHash } from '@/science/lessons';
import { getConfig } from './sync';

export const USTOZ_VOICE = 'Iapetus';
const KEY = 'nobu.tts.v1';
let mem: Record<string, string> | null = null;
const inflight: Record<string, Promise<string | null>> = {};

async function cache() {
  if (!mem) { try { mem = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}'); } catch { mem = {}; } }
  return mem!;
}

/** Matn uchun ovoz manzili (to'liq URL) yoki null (server yo'q / xato). */
export function ttsUrl(text: string): Promise<string | null> {
  const h = textHash(`${USTOZ_VOICE}|${text}`);
  if (h in inflight) return inflight[h];
  inflight[h] = (async () => {
    const c = await cache();
    const cfg = await getConfig();
    if (!cfg) return null;
    if (c[h]) return `${cfg.url}${c[h]}`;
    try {
      const r = await fetch(`${cfg.url}/api/nobu/tts`, {
        method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: USTOZ_VOICE, h }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) return null;
      c[h] = d.url;
      AsyncStorage.setItem(KEY, JSON.stringify(c)).catch(() => {});
      return `${cfg.url}${d.url}`;
    } catch {
      return null;
    }
  })().finally(() => { setTimeout(() => { delete inflight[h]; }, 0); });
  return inflight[h];
}

/** Bir nechta matnni oldindan tayyorlash (ketma-ket — server va Gemini'ni bo'g'maslik uchun). */
export async function prefetch(texts: string[]) {
  for (const t of texts) { if (t) await ttsUrl(t); }
}
