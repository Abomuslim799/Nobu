/**
 * choice.tsx — bitta test savoli (variantlar). Javobdan keyin to'g'ri/xato rangi va izoh.
 * Rich — **qalin** joylarni yashil qilib ko'rsatadigan matn.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, R } from '@/constants/theme';
import { Card, T } from '@/ui/kit';

export function Rich({ text, size = 16 }: { text: string; size?: number }) {
  return (
    <Text style={{ color: C.text, fontSize: size, lineHeight: size * 1.5 }}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**')
          ? <Text key={i} style={{ fontWeight: '700', color: C.green }}>{part.slice(2, -2)}</Text>
          : part)}
    </Text>
  );
}

export function Choice({ q, options, answer, why, onAnswer }: {
  q: string; options: string[]; answer: string; why?: string; onAnswer?: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
    onAnswer?.(o === answer);
  };
  return (
    <Card style={{ gap: 8 }}>
      <Rich text={q} size={17} />
      {options.map((o) => (
        <Pressable key={o} onPress={() => pick(o)}
          style={[s.opt, picked && o === answer && s.right, picked === o && o !== answer && s.wrong]}>
          <Text style={s.optText}>{o}</Text>
        </Pressable>
      ))}
      {picked && why ? <View><T dim size={14}>{picked === answer ? '✓ ' : '✗ '}{why}</T></View> : null}
    </Card>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' },
  half: { width: '48%', flexGrow: 1 },
  pillText: { color: C.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.card, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: C.green },
  feedback: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4, backgroundColor: C.card },
  next: { paddingVertical: 15, borderRadius: 14, backgroundColor: C.green, alignItems: 'center' },
  nextText: { color: C.bg, fontSize: 17, fontWeight: '800' },
  review: { gap: 2, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.cardBorder },
  opt: { padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  right: { backgroundColor: C.greenSoft, borderColor: C.green },
  wrong: { backgroundColor: C.redSoft, borderColor: C.red },
  optText: { color: C.text, fontSize: 16 },
});

/**
 * QuizRunner — savollar BITTADAN: tepada "3/10" va chiziq, ixcham variantlar
 * (qisqa bo'lsa 2 ustunda), javobdan keyin izoh + "Keyingi", oxirida natija va xatolar ro'yxati.
 */
export interface QuizItem { q: string; options: string[]; answer: string; why?: string }

export function QuizRunner({ items, onFinish, finishLabel = 'Davom etish' }: {
  items: QuizItem[]; onFinish: (correct: number) => void; finishLabel?: string;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ item: QuizItem; picked: string }[]>([]);
  const [order] = useState(() => items.map((it) => [...it.options].sort(() => Math.random() - 0.5)));

  if (i >= items.length) {
    const correct = items.length - wrong.length;
    return (
      <Card style={{ gap: 10 }}>
        <T size={24} bold>{correct}/{items.length} to'g'ri {correct === items.length ? '🏆' : ''}</T>
        {wrong.length > 0 && <T bold>Xatolar tahlili:</T>}
        {wrong.map(({ item, picked: p }, k) => (
          <View key={k} style={s.review}>
            <Rich text={item.q.replace(/_{3,}/, `**${item.answer}**`)} size={15} />
            <T size={13} color={C.red}>Siz: {p}</T>
            {item.why ? <T dim size={13}>{item.why}</T> : null}
          </View>
        ))}
        <Pressable style={s.next} onPress={() => onFinish(correct)}>
          <Text style={s.nextText}>{finishLabel}</Text>
        </Pressable>
      </Card>
    );
  }

  const item = items[i];
  const opts = order[i];
  const short = opts.every((o) => o.length <= 16);
  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o !== item.answer) setWrong((w) => [...w, { item, picked: o }]);
  };
  const next = () => { setPicked(null); setI(i + 1); };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <T dim size={13}>{i + 1}/{items.length}</T>
        <View style={s.track}><View style={[s.fill, { width: `${(i / items.length) * 100}%` }]} /></View>
      </View>
      <Card style={{ gap: 14, paddingVertical: 20 }}>
        <Rich text={item.q.replace(/_{3,}/, '_____')} size={19} />
      </Card>
      <View style={[s.grid, !short && { flexDirection: 'column' }]}>
        {opts.map((o) => (
          <Pressable key={o} onPress={() => pick(o)}
            style={({ pressed }) => [s.pill, short && s.half, pressed && !picked && { opacity: 0.7 },
              picked && o === item.answer && s.right, picked === o && o !== item.answer && s.wrong,
              picked && o !== item.answer && picked !== o && { opacity: 0.45 }]}>
            <Text style={s.pillText}>{o}</Text>
          </Pressable>
        ))}
      </View>
      {picked && (
        <>
          <View style={[s.feedback, { borderColor: picked === item.answer ? C.green : C.red }]}>
            <T bold color={picked === item.answer ? C.green : C.red}>
              {picked === item.answer ? "✓ To'g'ri" : `✗ To'g'ri javob: ${item.answer}`}
            </T>
            {item.why ? <T dim size={14}>{item.why}</T> : null}
          </View>
          <Pressable style={s.next} onPress={next}>
            <Text style={s.nextText}>{i + 1 < items.length ? 'Keyingi →' : 'Natija'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
