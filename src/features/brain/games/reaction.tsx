/** Miya o'yini: Reaction. */

import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { type GameProps, rnd, s } from '@/features/brain/games/kit';

// ── ⚡ Reaksiya ─────────────────────────────────────────────────────────────
export function Reaction({ onDone }: GameProps) {
  const ROUNDS = 5;
  const [state, setState] = useState<'wait' | 'go' | 'early'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const shown = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = () => {
    setState('wait');
    timer.current = setTimeout(() => { shown.current = Date.now(); setState('go'); }, 1200 + rnd(2500));
  };
  useEffect(() => { arm(); return () => { if (timer.current) clearTimeout(timer.current); }; }, []);
  const tap = () => {
    if (state === 'wait') { if (timer.current) clearTimeout(timer.current); setState('early'); setTimeout(arm, 900); return; }
    if (state !== 'go') return;
    const ms = Date.now() - shown.current;
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= ROUNDS) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      onDone(((500 - avg) / 250) * 100, [`o'rtacha ${Math.round(avg)} ms`]);   // 250 ms → 100%, 500 ms → 0%
    } else arm();
  };
  return (
    <Pressable onPress={tap} style={[s.reaction, { backgroundColor: state === 'go' ? C.green : state === 'early' ? C.red : C.card }]}>
      <Text style={[s.btnText, { color: state === 'go' ? C.bg : C.text }]}>
        {state === 'go' ? 'BOSING!' : state === 'early' ? 'Erta bosdingiz!' : 'Yashil bo\'lishini kuting...'}
      </Text>
      <T dim>{times.length}/{ROUNDS} {times.length ? `· oxirgi ${times[times.length - 1]} ms` : ''}</T>
    </Pressable>
  );
}
