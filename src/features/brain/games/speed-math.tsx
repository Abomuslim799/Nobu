/** Miya o'yini: SpeedMath. */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { makeProblem, type Problem } from '@/features/brain/speed-math';
import { Bar, T } from '@/core/ui/kit';
import { type GameProps, s, useCountdown } from '@/features/brain/games/kit';

// ── ⚡ Tezkor hisob ─────────────────────────────────────────────────────────
export function SpeedMath({ level, onDone }: GameProps) {
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [p, setP] = useState<Problem>(() => makeProblem(level * 4));
  const target = 10 + level * 3;                      // 100% uchun kerakli to'g'ri javoblar
  const [left, setLeft] = useCountdown(60, () => onDone((score / target) * 100, wrong.slice(-8)));
  const answer = (v: number) => {
    if (v === p.answer) { setScore((x) => x + 1); setP(makeProblem(level * 4 + score + 1)); }
    else { setLeft((t) => Math.max(0, t - 3)); setWrong((w) => [...w, `${p.text} = ${p.answer} (javob: ${v})`]); }
  };
  return (
    <View style={{ gap: 16 }}>
      <Bar value={left / 60} color={left < 10 ? C.red : C.green} />
      <T dim>Ball: {score} / maqsad {target} · xato −3 s</T>
      <Text style={s.big}>{p.text}</Text>
      <View style={s.grid}>
        {p.options.map((o) => <Pressable key={o} onPress={() => answer(o)} style={s.btn}><Text style={s.btnText}>{o}</Text></Pressable>)}
      </View>
    </View>
  );
}
