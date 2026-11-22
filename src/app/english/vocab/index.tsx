/**
 * english/vocab/index.tsx — So'z bazasi: ikki bo'lim (So'zlar / Collocation), mantiq bir xil.
 *   Yangi — kunlik kvota (so'z 30, collocation 10), qarz ko'rinadi.  Takror — kamida 30, chegarasi yo'q.
 *   Statuslar: Hard / Normal / Easy.
 */

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { REVIEW_MIN, STATUS_UI, type Kind } from '@/features/english/vocab/srs';
import { summary, useVocab } from '@/features/english/vocab/store';

const KINDS: { id: Kind; label: string }[] = [{ id: 'word', label: "🔤 So'zlar" }, { id: 'colloc', label: '🧩 Collocation' }];

export default function VocabHome() {
  const insets = useSafeAreaInsets();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = k === 'colloc' ? 'colloc' : 'word';
  const { v, items, reload } = useVocab();
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const sum = v ? summary(v, items, kind) : null;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>So'z bazasi</T>
        <Pressable onPress={() => router.push('/english/vocab/bases')} hitSlop={10}><T size={15} color={C.green}>Bazalar</T></Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {KINDS.map((x) => (
            <Pressable key={x.id} onPress={() => router.setParams({ kind: x.id })} style={{
              flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
              backgroundColor: kind === x.id ? C.greenSoft : 'transparent', borderWidth: 1, borderColor: kind === x.id ? C.green : C.cardBorder,
            }}>
              <T bold color={kind === x.id ? C.green : C.text}>{x.label}</T>
            </Pressable>
          ))}
        </View>

        {sum && (
          <>
            <Card style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <T bold size={18} style={{ flex: 1 }}>🆕 Yangi</T>
                <T bold size={18}>{sum.plan.doneToday}/{sum.plan.quota}</T>
              </View>
              <Bar value={Math.min(1, sum.plan.doneToday / sum.plan.quota)} />
              {sum.plan.debt > 0 && <T color={C.red} size={13}>Qarz: {sum.plan.debt} ta — jadvaldan orqadasiz</T>}
              <Button label={sum.plan.left ? `O'rganish · ${sum.plan.left} ta qoldi` : '✅ Bugungi reja bajarildi'}
                disabled={!sum.plan.left} onPress={() => router.push(`/english/vocab/learn?kind=${kind}`)} />
            </Card>

            <Card style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <T bold size={18} style={{ flex: 1 }}>🔁 Takror</T>
                <T bold size={18} color={sum.reviewed >= REVIEW_MIN ? C.good : C.text}>{sum.reviewed}/{REVIEW_MIN}+</T>
              </View>
              <Bar value={Math.min(1, sum.reviewed / REVIEW_MIN)} />
              <T dim size={13}>Kamida {REVIEW_MIN} ta, chegarasi yo'q — xohlagancha davom eting.</T>
              <Button kind={sum.learned ? 'primary' : 'ghost'} label="Takrorlash" disabled={!sum.learned}
                onPress={() => router.push(`/english/vocab/review?kind=${kind}`)} />
            </Card>

            <Card style={{ gap: 10 }}>
              <T bold>O'rganilgan: {sum.learned} / {sum.total}</T>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['hard', 'normal', 'easy'] as const).map((st) => (
                  <View key={st} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: STATUS_UI[st].color }}>
                    <T bold size={20} color={STATUS_UI[st].color}>{sum.count[st]}</T>
                    <T dim size={12}>{STATUS_UI[st].label}</T>
                  </View>
                ))}
              </View>
              <T dim size={12}>Hard — tez-tez qaytadi · Easy — kam; 30 kundan keyin Normal'ga qaytadi.</T>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
