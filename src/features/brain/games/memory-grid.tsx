/** Miya o'yini: MemoryGrid. */

import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { type GameProps, shuffle } from './kit';

// ── 🧠 Xotira panjarasi ─────────────────────────────────────────────────────
export function MemoryGrid({ level, onDone }: GameProps) {
  const ROUNDS = 5;
  const size = Math.min(6, 3 + Math.floor((level - 1) / 2));      // 3×3 → 6×6
  const count = Math.min(size * size - 2, 2 + level);
  const [round, setRound] = useState(0);
  const [cells, setCells] = useState<number[]>([]);
  const [show, setShow] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  useEffect(() => {
    setCells(shuffle([...Array(size * size).keys()]).slice(0, count));
    setPicked([]); setShow(true);
    const t = setTimeout(() => setShow(false), 900 + count * 250);
    return () => clearTimeout(t);
  }, [round, size, count]);
  const tap = (i: number) => {
    if (show || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    const wrongs = next.filter((x) => !cells.includes(x)).length;
    if (next.length - wrongs >= count || wrongs >= 3) {
      const sc = Math.max(0, ((next.length - wrongs) / count) * 100 - wrongs * 15);
      const all = [...scores, sc];
      setScores(all);
      setTimeout(() => (round + 1 >= ROUNDS
        ? onDone(all.reduce((a, b) => a + b, 0) / all.length, [`${size}×${size}, ${count} katak`])
        : setRound(round + 1)), 600);
    }
  };
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <T dim>{round + 1}/{ROUNDS} · {show ? 'Eslab qoling!' : `${count} ta katakni bosing`}</T>
      <View style={{ width: 300, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {[...Array(size * size).keys()].map((i) => {
          const lit = show && cells.includes(i);
          const hit = picked.includes(i) && cells.includes(i);
          const miss = picked.includes(i) && !cells.includes(i);
          return (
            <Pressable key={i} onPress={() => tap(i)} style={{
              width: (300 - 6 * (size - 1)) / size, height: (300 - 6 * (size - 1)) / size, borderRadius: 8,
              backgroundColor: lit || hit ? C.green : miss ? C.red : C.card, borderWidth: 1, borderColor: C.cardBorder,
            }} />
          );
        })}
      </View>
    </View>
  );
}
