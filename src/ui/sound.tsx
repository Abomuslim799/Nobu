/**
 * sound.tsx — ovoz tugmalari va tezlik tanlagich (kartochka va test ekranlari uchun).
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { RATES, say, useRate, type Part } from '@/lib/speak';

export function SoundButton({ id, part, text, label }: { id: string; part: Part; text: string; label: string }) {
  return (
    <Pressable onPress={() => say(id, part, text)} hitSlop={6}
      style={({ pressed }) => [s.btn, pressed && { opacity: 0.6 }]}>
      <Text style={s.btnText}>🔊 {label}</Text>
    </Pressable>
  );
}

export function RateSwitch() {
  const [rate, setRate] = useRate();
  return (
    <View style={s.rates}>
      {RATES.map((r) => (
        <Pressable key={r} onPress={() => setRate(r)} hitSlop={4}
          style={[s.rate, rate === r && { backgroundColor: C.green }]}>
          <Text style={[s.rateText, rate === r && { color: C.bg }]}>{r}×</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.greenSoft },
  btnText: { color: C.green, fontSize: 15, fontWeight: '600' },
  rates: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 16, backgroundColor: C.card },
  rate: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 13 },
  rateText: { color: C.dim, fontSize: 13, fontWeight: '700' },
});
