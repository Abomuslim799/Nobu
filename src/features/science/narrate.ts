/**
 * narrate.ts — Ustoz darsdagi matnni ovozda o'qiydi (Gemini Iapetus, server yasaydi va keshlaydi — lib/tts.ts).
 *   main — blok ochilganda, after ("r") — javobdan keyin (izoh/yechim).
 *   ?v=<xesh> — matn o'zgarsa, telefon keshdagi eski ovozni emas, yangisini oladi.
 * Avtomatik o'qish yoqilgan/o'chirilgani telefonda saqlanadi.
 */

import { AUDIO_BASE } from '@/core/config';
import { markActive } from '@/core/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { prefetch, ttsUrl } from '@/core/audio/tts';
import { blockSay, type SciLesson } from '@/features/science/lessons';
import { sayText } from '@/features/science/speech';
import { KEYS } from '@/core/storage';
const KEY = KEYS.autoread;

export function useNarrator(lesson: SciLesson | undefined) {
  const player = useRef<AudioPlayer | null>(null);
  const [on, setOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const want = useRef(0);                         // eng oxirgi so'rov — eskisi kech kelsa, chalinmaydi

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v === '0' && setOn(false)).catch(() => {});
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(null);
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st) => { setSpeaking(!!st.playing); if (st.playing) markActive(); });   // tinglash ham faol vaqt
    return () => { sub.remove(); p.remove(); };
  }, []);
  // Dars ochilganda barcha qadamlar ovozini fonda tayyorlab qo'yamiz
  useEffect(() => {
    if (!lesson) return;
    const texts = lesson.blocks.flatMap((b) => { const s = blockSay(b); return s ? [s.main, s.after ?? ''] : []; }).map(sayText);
    prefetch(texts).catch(() => {});
  }, [lesson?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** Shu blokda o'qiladigan matn bormi. */
  const has = (idx: number, after = false) => { const b = lesson?.blocks[idx]; const s = b && blockSay(b); return !!(after ? s?.after : s?.main); };

  const play = async (idx: number, after = false) => {
    const p = player.current, b = lesson?.blocks[idx];
    if (!p || !lesson || !b) return;
    const s = blockSay(b);
    const text = after ? s?.after : s?.main;
    if (!text) return;
    const my = ++want.current;
    setLoading(true);
    const url = await ttsUrl(sayText(text), `${AUDIO_BASE}sci-${lesson.id}-s${idx}${after ? 'r' : ''}.mp3`);   // zaxira — Sardor
    if (my !== want.current) return;              // foydalanuvchi boshqa qadamga o'tib bo'lgan
    setLoading(false);
    if (!url) return;
    p.replace({ uri: url });
    p.play();
  };
  const stop = () => { want.current++; setLoading(false); player.current?.pause(); setSpeaking(false); };
  const toggle = () => {
    const v = !on;
    setOn(v);
    AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
    if (!v) stop();
  };
  return { on, speaking, loading, play, stop, toggle, has };
}
