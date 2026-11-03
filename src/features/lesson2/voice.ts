/**
 * voice.ts — Ustoz ovozi (v2 darslar): matn → server TTS → chalish. Ovoz yo'q bo'lsa jim (subtitr qoladi).
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { markActive } from '@/core/activity';
import { ttsUrl } from '@/core/tts';
import { sayText } from '@/features/science/speech';

export function useVoice() {
  const player = useRef<AudioPlayer | null>(null);
  const want = useRef(0);
  const [on, setOn] = useState(true);
  const onRef = useRef(true);
  const [busy, setBusy] = useState(false);

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
    ttsUrl(sayText(text)).then((url) => {
      if (my !== want.current) return;
      const p = player.current;
      if (p && url) { p.replace({ uri: url }); p.play(); } else setBusy(false);
    });
  };
  const toggle = () => { if (on) stop(); onRef.current = !on; setOn(!on); };
  return { say, stop, on, toggle, busy };
}
