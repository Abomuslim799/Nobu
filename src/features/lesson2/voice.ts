/**
 * voice.ts — Ustoz ovozi (v2 darslar): matn → server TTS → chalish. Ovoz yo'q bo'lsa jim (subtitr qoladi).
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { markActive } from '@/core/activity';
import { AUDIO_BASE } from '@/core/config';
import { textHash } from '@/core/hash';
import { ttsError, ttsUrl } from '@/core/tts';
import { sayText } from '@/features/science/speech';

/** Zaxira ovoz (Sardor, GitHub Pages): CI scripts/dump_say.ts dagi v2 matnlaridan yasaydi — nomi matn xeshi bo'yicha. */
export const v2Fallback = (topic: string, speak: string) => `${AUDIO_BASE}v2-${topic}-s${textHash(speak)}.mp3`;

export function useVoice(topic: string) {
  const player = useRef<AudioPlayer | null>(null);
  const want = useRef(0);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(null);
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st) => {
      if (st.playing) markActive();                 // tinglash — faol vaqt
      if (st.didJustFinish) setBusy(false);
    });
    return () => { sub.remove(); p.remove(); };
  }, []);

  const stop = () => { want.current++; player.current?.pause(); setBusy(false); };
  const say = (text: string) => {
    stop();
    if (!onRef.current || !text) return;
    const my = want.current;
    setBusy(true);
    const speak = sayText(text);
    ttsUrl(speak, v2Fallback(topic, speak)).then((url) => {
      if (my !== want.current) return;
      const p = player.current;
      if (p && url) { p.replace({ uri: url }); p.play(); setErr(''); } else { setBusy(false); setErr(ttsError() || "ovoz topilmadi"); }
    });
  };
  const toggle = () => { if (on) stop(); onRef.current = !on; setOn(!on); };
  return { say, stop, on, toggle, busy, err };
}
