/** Miya o'yini: Sequence. */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { Button, T } from '@/core/ui/kit';
import { type GameProps, rnd, s, shuffle } from '@/features/brain/games/kit';

// ── 🧩 Ketma-ketlik: keyingi son qaysi? ──────────────────────────────────────
function makeSequence(level: number): { shown: number[]; answer: number; rule: string; opts: number[] } {
  const tiers = [
    ['diff2', 'mulAdd', 'inter', 'sqPlus'],
    ['diff2', 'mulAdd', 'inter', 'fibC', 'cube', 'mulInc'],
    ['altOps', 'inter2', 'primes', 'fibC', 'mulInc', 'diff3'],
  ];
  const t = tiers[level <= 2 ? 0 : level <= 4 ? 1 : 2];
  const k = t[rnd(t.length)];
  const a = 2 + rnd(8), d = 2 + rnd(4), e = 1 + rnd(3), xs: number[] = [];
  const N = 7;
  const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
  for (let i = 0; i < N; i++) {
    if (k === 'diff2') xs.push(a + d * i + (e * i * (i - 1)) / 2);
    if (k === 'diff3') xs.push(a + d * i + e * i * i * i);
    if (k === 'mulAdd') xs.push(i ? xs[i - 1] * 2 + (e % 2 ? 1 : -1) : a);
    if (k === 'inter') xs.push(i % 2 ? 30 - Math.floor(i / 2) * e : a + (i / 2) * d);
    if (k === 'inter2') xs.push(i % 2 ? a * 2 ** Math.floor(i / 2) : 50 - (i / 2) * d);
    if (k === 'sqPlus') xs.push((i + 1) ** 2 + e);
    if (k === 'cube') xs.push((i + 1) ** 3 - e);
    if (k === 'fibC') xs.push(i < 2 ? a + i : xs[i - 1] + xs[i - 2] - e);
    if (k === 'mulInc') xs.push(i ? xs[i - 1] * (i + 1) : 1 + rnd(2));
    if (k === 'altOps') xs.push(i ? (i % 2 ? xs[i - 1] + d : xs[i - 1] * 2) : a);
    if (k === 'primes') xs.push(P[i + (level > 6 ? 2 : 0)] * 2 + e);
  }
  const rules: Record<string, string> = {
    diff2: `ayirmalar har safar ${e} ga oshadi`, diff3: 'ayirmalar kub bilan o\'sadi (i³)',
    mulAdd: `×2 ${e % 2 ? '+1' : '−1'}`, inter: 'ikki ketma-ketlik aralash: toq o\'rinlar +, juft o\'rinlar −',
    inter2: 'ikki ketma-ketlik aralash: biri ×2, ikkinchisi kamayadi', sqPlus: `n² + ${e}`, cube: `n³ − ${e}`,
    fibC: `oldingi ikkisining yig'indisi − ${e}`, mulInc: '×2, ×3, ×4 ... (har safar ko\'paytuvchi oshadi)',
    altOps: `navbatma-navbat +${d} va ×2`, primes: `tub son × 2 + ${e}`,
  };
  const shown = xs.slice(0, N - 1), answer = xs[N - 1];
  // Chalg'ituvchi variantlar — eng ko'p uchraydigan noto'g'ri qoidalar natijasi
  const last = shown[shown.length - 1], diff = last - shown[shown.length - 2];
  const wrong = [last + diff, answer + e, answer - d, last + (shown[1] - shown[0]), answer + 2 * d, answer - 1]
    .filter((v) => v !== answer);
  const opts = shuffle([answer, ...[...new Set(wrong)].slice(0, 3)]);
  return { shown, answer, rule: rules[k], opts };
}
export function Sequence({ level, onDone }: GameProps) {
  const ROUNDS = 8;
  const [r, setR] = useState(0);
  const [q, setQ] = useState(() => makeSequence(level));
  const [ok, setOk] = useState(0);
  const [miss, setMiss] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const opts = q.opts;
  const pick = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    if (v === q.answer) setOk((x) => x + 1); else setMiss((m) => [...m, `${q.shown.join(', ')} → ${q.answer} (${q.rule})`]);
  };
  const next = () => {
    if (r + 1 >= ROUNDS) onDone(((ok) / ROUNDS) * 100, miss);
    else { setR(r + 1); setQ(makeSequence(level)); setPicked(null); }
  };
  return (
    <View style={{ gap: 16 }}>
      <T dim>{r + 1}/{ROUNDS} · Keyingi son qaysi?</T>
      <Text style={[s.big, { fontSize: 24 }]}>{q.shown.join(', ')}, ?</Text>
      <View style={s.grid}>
        {opts.map((o) => (
          <Pressable key={o} onPress={() => pick(o)} style={[s.btn, picked !== null && o === q.answer && { borderColor: C.green },
            picked === o && o !== q.answer && { borderColor: C.red }]}>
            <Text style={s.btnText}>{o}</Text>
          </Pressable>
        ))}
      </View>
      {picked !== null && <><T dim>Qoida: {q.rule}</T><Button label="Keyingisi" onPress={next} /></>}
    </View>
  );
}
