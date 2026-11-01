/** Simulyatsiyalar uchun umumiy bo'laklar: ramka, o'lchov jadvali, tanlov tugmalari, ▶ tugmasi. */

import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';

export const Box = ({ children, onLayout }: { children: React.ReactNode; onLayout?: (e: any) => void }) => (
  <View onLayout={onLayout} style={{ backgroundColor: C.simBg, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' }}>{children}</View>
);
// Qiymatlar: 2 ustunli qat'iy to'r va bir xil kenglikdagi raqamlar — son o'zgarganda qutilar sakramaydi
export const Readout = ({ rows }: { rows: [string, string, string?][] }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {rows.map(([k, v, c]) => (
      <View key={k} style={{ flexBasis: '48%', flexGrow: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: C.subtle }}>
        <Text style={{ color: C.dim, fontSize: 11 }} numberOfLines={1}>{k}</Text>
        <Text style={{ color: c ?? C.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text>
      </View>
    ))}
  </View>
);
export const Chips = <T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    {items.map((it) => (
      <Pressable key={it.id} onPress={() => onChange(it.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
        borderWidth: 1, borderColor: value === it.id ? C.green : C.cardBorder, backgroundColor: value === it.id ? C.greenSoft : 'transparent' }}>
        <Text style={{ color: C.text, fontSize: 13 }}>{it.label}</Text>
      </Pressable>
    ))}
  </View>
);
export const PlayBtn = ({ on, onPress, label }: { on: boolean; onPress: () => void; label?: string }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: on ? C.redSoft : C.greenSoft,
    borderWidth: 1, borderColor: on ? C.red : C.green }}>
    <Text style={{ color: C.text, fontWeight: '700' }}>{label ?? (on ? '⏸ To\'xtatish' : '▶ Boshlash')}</Text>
  </Pressable>
);
