/**
 * speak.ts — so'z, gap va tarjimani ovozda o'qish.
 *
 * 1-navbat: tayyor mp3 (Microsoft neyron ovozlari, GitHub'da yasaladi):
 *    inglizcha — en-GB Ryan (London erkak ovozi), o'zbekcha — uz-UZ Sardor.
 * 2-navbat (o'zingiz qo'shgan so'zlar yoki mp3 yo'q bo'lsa): telefonning britan erkak
 *    ovozi — Daniel / Arthur. O'zbekcha uchun telefonda ovoz yo'q → false qaytadi.
 *
 * Tezlik (0.5× / 0.75× / 1×) telefonda saqlanadi va hamma joyda amal qiladi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

import { AUDIO } from '@/data/audio';

/** w — so'z, s — misol gap, uz — o'zbekcha tarjima; unitlarda: p0.. (matn), d0.. (diktant), sh0.., q (iqtibos). */
export type Part = string;
export type AudioMap = Record<string, string[]>;    // id → mavjud qismlar: ['w', 's', 'uz']
/** mp3 fayllar GitHub Pages'da (site.yml joylaydi) — ilova paketini og'irlashtirmaydi. */
const AUDIO_BASE = 'https://abomuslim799.github.io/Nobu/audio/';
export const RATES = [0.5, 0.75, 1] as const;

// ── Tezlik ──────────────────────────────────────────────────────────────────
const RATE_KEY = 'dojo.rate';
let rate = 1;
const listeners = new Set<(r: number) => void>();
AsyncStorage.getItem(RATE_KEY).then((v) => v && setRate(Number(v))).catch(() => {});

export function setRate(r: number) {
  rate = r;
  AsyncStorage.setItem(RATE_KEY, String(r)).catch(() => {});
  listeners.forEach((fn) => fn(r));
}

/** Ekranlar uchun: joriy tezlik va uni o'zgartirish. */
export function useRate(): [number, (r: number) => void] {
  const [value, setValue] = useState(rate);
  useEffect(() => {
    listeners.add(setValue);
    return () => { listeners.delete(setValue); };
  }, []);
  return [value, setRate];
}

// ── Ijro ────────────────────────────────────────────────────────────────────
let player: AudioPlayer | null = null;
let ready = false;

function getPlayer() {
  if (!ready) {
    ready = true;
    // Telefon jim rejimda (silent) bo'lsa ham eshitilsin.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  player ??= createAudioPlayer(null);
  return player;
}

const MALE_GB = ['arthur', 'daniel', 'oliver', 'malcolm', 'jamie'];
let voice: string | undefined;
let picked = false;
async function phoneVoice() {
  if (picked) return voice;
  picked = true;
  try {
    const gb = (await Speech.getAvailableVoicesAsync()).filter((v) => v.language === 'en-GB');
    const score = (v: Speech.Voice) => {
      const i = MALE_GB.findIndex((n) => v.name.toLowerCase().includes(n));
      return (i >= 0 ? 100 - i : 0) + (v.quality === Speech.VoiceQuality.Enhanced ? 50 : 0);
    };
    voice = gb.sort((a, b) => score(b) - score(a))[0]?.identifier;
  } catch {
    voice = undefined;
  }
  return voice;
}

/**
 * O'qish. id — so'z identifikatori (mp3 qidirish uchun), text — mp3 bo'lmasa telefon o'qiydi.
 * Qaytaradi: ovoz chalindimi (o'zbekcha mp3 bo'lmasa — false).
 */
export async function say(id: string, part: Part, text: string): Promise<boolean> {
  stopSpeaking();
  if (AUDIO[id]?.includes(part)) {
    const p = getPlayer();
    p.replace({ uri: `${AUDIO_BASE}${id}-${part}.mp3` });
    p.setPlaybackRate(rate, 'high');      // 'high' — sekinlashganda ovoz pasaymaydi
    p.play();
    return true;
  }
  if (part === 'uz' || !text) return false;
  Speech.speak(text, { language: 'en-GB', voice: await phoneVoice(), rate: rate * 0.95 });
  return true;
}

export function hasUzbekAudio(id: string) {
  return Boolean(AUDIO[id]?.includes('uz'));
}

export function stopSpeaking() {
  Speech.stop();
  player?.pause();
}
