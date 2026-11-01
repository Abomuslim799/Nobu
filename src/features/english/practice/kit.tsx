/** Mashq ekranlari uchun umumiy: tanlov qatori va uslublar. */

import { Pressable, StyleSheet } from 'react-native';

import { C, PAD, R } from '@/core/theme';
import { T } from '@/core/ui/kit';

/** Tanlov ro'yxati uchun oddiy tugma-qator. */
export function Pick({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pick, pressed && { opacity: 0.7 }]}>
      <T bold>{label}</T>
      {sub ? <T dim size={13}>{sub}</T> : null}
    </Pressable>
  );
}

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  pick: { padding: 14, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, gap: 2 },
  play: { alignSelf: 'center', width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenSoft },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
