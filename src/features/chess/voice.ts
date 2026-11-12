/**
 * voice.ts — Farobiy ovozi: gapni ko'rsatish va ovoz faylini chalish, tugashini kutish
 * ("avval gapiradi, keyin yuradi"). Ikki qismli gap (maqsad + "You… will… try.") ketma-ket chalinadi.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { AUDIO_BASE } from '@/core/config';
import { api, serverUrl } from '@/core/server';
import { phrase } from '@/features/chess/bot';
import type { Say } from '@/features/chess/talk';

export interface Line { text: string; files: string[]; words: number[] }
/** Gap matni va fayllari (rnd berilsa — takrorlanadigan tanlov). */
export function lineOf(s: Say, rnd: () => number = Math.random): Line {
  const ps = s.parts.map((k) => phrase(k, rnd));
  const text = ps.map((p) => p.text).reduce((acc, t) => (!acc ? t : /[.!?]$/.test(acc) && /^[a-z]/.test(t) ? `${acc} ${t[0].toUpperCase()}${t.slice(1)}` : `${acc} ${t}`), '');
  return { text, files: ps.map((p) => p.file), words: ps.map((p) => p.text.split(' ').length) };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Ovoz manbai: server tayyor bo'lsa — ElevenLabs (jonli), bo'lmasa — saytdagi oddiy ovoz. Bir marta aniqlanadi. */
let basePromise: Promise<string> | null = null;
export function voiceBase(): Promise<string> {
  if (!basePromise) basePromise = (async () => {
    try {
      const st = await api<{ ready: boolean }>('/chess/voice-status', undefined, { timeoutMs: 6000 });
      const u = st.ready ? await serverUrl('/chess-voice/') : null;
      if (u) return u;
    } catch { /* server yo'q — oddiy ovoz */ }
    return AUDIO_BASE;
  })();
  return basePromise;
}

export function useVoice() {
  const player = useRef<AudioPlayer | null>(null);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const seq = useRef(0);
  const base = useRef(AUDIO_BASE);
  useEffect(() => { onRef.current = on; }, [on]);
  useEffect(() => {
    try { player.current = createAudioPlayer(null); } catch { /* ovozsiz */ }
    voiceBase().then((b) => { base.current = b; });
    return () => { seq.current++; player.current?.remove(); };
  }, []);

  const one = (file: string, words: number, my: number) => new Promise<void>((res) => {
    const p = player.current;
    if (!onRef.current || !p || my !== seq.current) { res(); return; }
    let sub: { remove: () => void } | null = null;
    const done = () => { clearTimeout(cap); sub?.remove(); res(); };
    const cap = setTimeout(done, Math.min(8000, 1500 + words * 500));   // fayl kelmasa ham osilib qolmasin
    try {
      sub = p.addListener('playbackStatusUpdate', (st) => { if (st.didJustFinish) done(); });
      p.replace({ uri: base.current + file }); p.play();
    } catch { done(); }
  });

  /** Chaladi va tugashini kutadi. Ovoz o'chiq bo'lsa — o'qishga qisqa pauza. */
  const play = async (l: Line) => {
    const my = ++seq.current;
    if (!onRef.current) { await sleep(Math.min(1800, 500 + l.text.length * 18)); return; }
    for (let i = 0; i < l.files.length; i++) {
      if (my !== seq.current) return;
      await one(l.files[i], l.words[i] ?? 6, my);
    }
  };
  const stop = () => { seq.current++; try { player.current?.pause(); } catch { /* jim */ } };
  return { on, setOn, play, stop };
}
