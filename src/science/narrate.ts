/**
 * narrate.ts — Ustoz darsdagi matnni ovozda o'qiydi (Sardor, mp3 — CI'da yasaladi: sci-<dars>-s<blok>[r].mp3).
 *   main — blok ochilganda, after ("r") — javobdan keyin (izoh/yechim).
 *   ?v=<xesh> — matn o'zgarsa, telefon keshdagi eski ovozni emas, yangisini oladi.
 * Avtomatik o'qish yoqilgan/o'chirilgani telefonda saqlanadi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { AUDIO } from '@/data/audio';
import { blockSay, textHash, type SciLesson } from './lessons';

const AUDIO_BASE = 'https://abomuslim799.github.io/Nobu/audio/';
const KEY = 'nobu.sci.autoread';

export function useNarrator(lesson: SciLesson | undefined) {
  const player = useRef<AudioPlayer | null>(null);
  const [on, setOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v === '0' && setOn(false)).catch(() => {});
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(null);
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st) => { setSpeaking(!!st.playing); });
    return () => { sub.remove(); p.remove(); };
  }, []);

  /** Bor-yo'qligi: shu blok uchun ovoz fayli yasalganmi. */
  const has = (idx: number, after = false) => !!lesson && !!AUDIO[`sci-${lesson.id}`]?.includes(`s${idx}${after ? 'r' : ''}`);

  const play = (idx: number, after = false) => {
    const p = player.current, b = lesson?.blocks[idx];
    if (!p || !lesson || !b) return;
    const s = blockSay(b);
    const text = after ? s?.after : s?.main;
    if (!text || !has(idx, after)) return;
    p.replace({ uri: `${AUDIO_BASE}sci-${lesson.id}-s${idx}${after ? 'r' : ''}.mp3?v=${textHash(text)}` });
    p.play();
  };
  const stop = () => { player.current?.pause(); setSpeaking(false); };
  const toggle = () => {
    const v = !on;
    setOn(v);
    AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
    if (!v) stop();
  };
  return { on, speaking, play, stop, toggle, has };
}
