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
  opt: { padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  right: { backgroundColor: C.greenSoft, borderColor: C.green },
  wrong: { backgroundColor: C.redSoft, borderColor: C.red },
  optText: { color: C.text, fontSize: 16 },
});
