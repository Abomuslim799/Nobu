/** Miya o'yini: Stroop. */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { type GameProps, rnd, s, shuffle, useCountdown } from '@/features/brain/games/kit';

// ── 🎯 Stroop: so'z bir rangda yozilgan, ma'nosi boshqa rang ─────────────────
// Tugmalarda rang NOMLARI yoziladi (rang emas) va o'zi ham chalg'ituvchi rangda — shunda so'zni o'qish
// odati xalaqit beradi. Har savolda qoida: "RANG" (yozuv rangi) yoki "MA'NO" (so'zning o'zi).
// 3-darajadan boshlab qoidalar aralashadi.
const COLORS = [
  { name: 'QIZIL', c: '#F87171' }, { name: 'YASHIL', c: '#34D399' }, { name: 'KO\'K', c: '#60A5FA' }, { name: 'SARIQ', c: '#FBBF24' },
];
export function Stroop({ level, onDone }: GameProps) {
  const mixed = level >= 3;
  const make = () => {
    const word = rnd(4);
    let ink = rnd(4);
    while (ink === word) ink = rnd(4);                       // har doim mos kelmaydi — chalg'itish majburiy
    const rule: 'ink' | 'word' = mixed && Math.random() < 0.4 ? 'word' : 'ink';
    return { word, ink, rule, btn: shuffle([0, 1, 2, 3]), btnInk: shuffle([0, 1, 2, 3]) };
  };
  const [q, setQ] = useState(make);
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState<string[]>([]);
  const secs = Math.max(25, 45 - level * 3);
  const target = 14 + level * 3;
  useCountdown(secs, () => onDone((ok / target) * 100 - bad.length * 4, bad.slice(-6)));
  const pick = (i: number) => {
    const right = q.rule === 'ink' ? q.ink : q.word;
    if (i === right) setOk((x) => x + 1);
    else setBad((b) => [...b, `${q.rule === 'ink' ? 'RANG' : "MA'NO"}: "${COLORS[q.word].name}" (${COLORS[q.ink].name.toLowerCase()} rangda) → siz ${COLORS[i].name}`]);
    setQ(make());
  };
  return (
    <View style={{ gap: 16 }}>
      <T dim>{secs} s · ✓{ok} ✗{bad.length}</T>
      <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: q.rule === 'ink' ? C.green : '#FBBF24' }}>
        {q.rule === 'ink' ? '🎨 YOZUV RANGINI tanlang' : "📖 SO'ZNING MA'NOSINI tanlang"}
      </Text>
      <Text style={[s.big, { color: COLORS[q.ink].c }]}>{COLORS[q.word].name}</Text>
      <View style={s.grid}>
        {q.btn.map((i, k) => (
          <Pressable key={i} onPress={() => pick(i)} style={s.btn}>
            <Text style={[s.btnText, { color: COLORS[q.btnInk[k]].c }]}>{COLORS[i].name}</Text>
          </Pressable>
        ))}
      </View>
      <T dim size={13}>Tugmalardagi yozuvlar ham boshqa rangda — faqat yozilgan NOMGA qarang.</T>
    </View>
  );
}
