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
    if (c[h]) return `${cfg.url}${c[h]}`;
    if (Date.now() < downUntil) return null;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15_000);
    try {
      const r = await fetch(`${cfg.url}/api/nobu/tts`, {
        method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: USTOZ_VOICE, h }), signal: ctl.signal,
      });
      const d = await r.json();
      if (!r.ok || !d.url) { lastError = String(d.error ?? `HTTP ${r.status}`); downUntil = Date.now() + 10 * 60_000; return null; }
      c[h] = d.url;
      AsyncStorage.setItem(KEY, JSON.stringify(c)).catch(() => {});
      return `${cfg.url}${d.url}`;
    } catch (e) {
      lastError = String(e); downUntil = Date.now() + 2 * 60_000;
      return null;
    } finally { clearTimeout(t); }
  })().finally(() => { setTimeout(() => { delete inflight[h]; }, 0); });
  return inflight[h].then((u) => u ?? fb);
}
let lastError = '';
export const ttsError = () => lastError;

/** Bir nechta matnni oldindan tayyorlash (ketma-ket — server va Gemini'ni bo'g'maslik uchun). */
export async function prefetch(texts: string[]) {
  for (const t of texts) { if (Date.now() < downUntil) return; if (t) await ttsUrl(t); }
}
