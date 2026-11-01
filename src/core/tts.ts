/**
 * tts.ts — Ustoz ovozi (Gemini, Iapetus) serverdan: matn → mp3 manzili. Server yasagan faylni keshlaydi,
 * ilova esa manzilni telefonda eslab qoladi — ikkinchi marta darhol chaladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { textHash } from '@/core/hash';
import { api, getConfig, serverUrl } from '@/core/server';
import { KEYS } from '@/core/storage';

const USTOZ_VOICE = 'Iapetus';
const KEY = KEYS.tts;
let mem: Record<string, string> | null = null;
const inflight: Record<string, Promise<string | null>> = {};

async function cache() {
  if (!mem) { try { mem = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}'); } catch { mem = {}; } }
  return mem!;
}

let downUntil = 0;                      // server/Gemini xato bersa (limit) — bir muddat to'g'ridan-to'g'ri zaxira ovoz

/** Matn uchun ovoz manzili: Gemini (server) → bo'lmasa zaxira (Sardor, GitHub Pages) → null.
 *  Server 15 s ichida javob bermasa yoki limit tugagan bo'lsa — zaxira ovoz chalinadi (jim qolmaydi). */
export function ttsUrl(text: string, fallback?: string): Promise<string | null> {
  const h = textHash(`${USTOZ_VOICE}|${text}`);
  const fb = fallback ? `${fallback}?v=${textHash(text)}` : null;
  if (h in inflight) return inflight[h].then((u) => u ?? fb);
  inflight[h] = (async () => {
    const c = await cache();
    const cfg = await getConfig();
    if (!cfg) return null;
    if (c[h]) return serverUrl(c[h]);
    if (Date.now() < downUntil) return null;
    try {
      const d = await api<{ url?: string; error?: string }>('/tts', { text, voice: USTOZ_VOICE, h }, { timeoutMs: 15_000, cfg });
      if (!d.url) throw new Error(d.error ?? "ovoz yo'q");
      c[h] = d.url;
      AsyncStorage.setItem(KEY, JSON.stringify(c)).catch(() => {});
      return serverUrl(d.url);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      downUntil = Date.now() + (/uzoq|ulanib/.test(lastError) ? 2 : 10) * 60_000;   // tarmoq — 2 daq, limit/xato — 10 daq
      return null;
    }
  })().finally(() => { setTimeout(() => { delete inflight[h]; }, 0); });
  return inflight[h].then((u) => u ?? fb);
}
let lastError = '';
export const ttsError = () => lastError;

/** Bir nechta matnni oldindan tayyorlash (ketma-ket — server va Gemini'ni bo'g'maslik uchun). */
export async function prefetch(texts: string[]) {
  for (const t of texts) { if (Date.now() < downUntil) return; if (t) await ttsUrl(t); }
}
