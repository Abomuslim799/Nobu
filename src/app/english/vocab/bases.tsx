/**
 * english/vocab/bases.tsx — bazalarni yoqish/o'chirish. Standart: hammasi yoqilgan (aralash, rang-barang).
 *   Yangi so'zlar yoqilgan bazalardan navbat bilan olinadi.
 */

import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { BASES } from '@/features/english/vocab/base';
import { useVocab } from '@/features/english/vocab/store';

export default function Bases() {
  const insets = useSafeAreaInsets();
  const { v, items, setEnabled } = useVocab();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>Bazalar</T>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        <T dim size={13}>Yoqilgan bazalardan yangi so'zlar aralash olinadi. Takror barcha o'rganilgan so'zlardan bo'ladi.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {BASES.map((b) => {
            const on = v?.enabled[b.id] !== false;
            const all = items.filter((w) => w.base === b.id);
            const done = v ? all.filter((w) => v.states[w.id]).length : 0;
            if (!all.length && b.id !== 'my') return null;
            return (
              <Pressable key={b.id} onPress={() => setEnabled(b.id, !on)} style={({ pressed }) => [{
                width: '48%', padding: 14, borderRadius: 18, gap: 6, borderWidth: 1.5,
                borderColor: on ? b.color : C.cardBorder, backgroundColor: on ? `${b.color}22` : C.card, opacity: pressed ? 0.7 : on ? 1 : 0.55,
              }]}>
                <T size={30}>{b.emoji}</T>
                <T bold size={16}>{b.title}</T>
                <T dim size={12}>{done}/{all.length} · {b.kind === 'colloc' ? 'collocation' : b.kind === 'word' ? "so'z" : "so'z + collocation"}</T>
                <T size={12} bold color={on ? b.color : C.dim}>{on ? '● Yoqilgan' : "○ O'chirilgan"}</T>
              </Pressable>
            );
          })}
        </View>
        <T dim size={11}>Core: New General Service List 1.2 (Browne, Culligan, Phillips), CC BY-SA 4.0.</T>
      </ScrollView>
    </View>
  );
}
