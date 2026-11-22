/**
 * english/drill/index.tsx — 6 oylik reja: bugungi 3 blok (B1, B2 — grammar, B3 — mistake bank + collocation),
 * haftaning boshqa kunlari va barcha 25 mavzu holati (Zaif / O'rta / Mustahkam).
 * Bloklar kunning istalgan vaqtida, tartib bilan: B1 → B2 → B3.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayKey } from '@/core/date';
import { C } from '@/core/theme';
import { Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { contentOf } from '@/features/english/drill/content';
import { STATUS, dayPlan, doneOn, phaseOf, statusOf, topicMinutes, weekOf, weekday } from '@/features/english/drill/logic';
import { useDrill, type DrillData } from '@/features/english/drill/store';
import { START, TOPICS, WEEKS, type DrillTopic } from '@/features/english/drill/topics';

const DAYS = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

export default function DrillHome() {
  const insets = useSafeAreaInsets();
  const { data, reload } = useDrill();
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const [openDay, setOpenDay] = useState<number | null>(null);

  const today = dayKey();
  const week = weekOf(today);
  const phase = phaseOf(Math.max(1, week));
  const day = weekday(today);
  const plan = dayPlan(day);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>🔁 6 oylik reja</T>
        <Pressable onPress={() => router.push({ pathname: '/nobu/chat', params: { key: 'drill:' } })} hitSlop={10}>
          <T size={15} color={C.green}>❓ Savol</T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        <Card style={{ gap: 4 }}>
          <T bold size={17}>{week ? `${week}/${WEEKS}-hafta · ${phase.name}` : `Reja ${START} dushanbadan boshlanadi`}</T>
          <T dim size={13}>{phase.about} · bitta gapga {phase.limit} s</T>
        </Card>

        {data && (
          <>
            <T bold size={18}>Bugun — {DAYS[day]}</T>
            <Block title="B1" topics={plan.b1} data={data} today={today} />
            <Block title="B2" topics={plan.b2} data={data} today={today} />
            <Card style={{ gap: 8 }}>
              <T bold>B3 · ~20 daq</T>
              <Row icon="🔁" title="Mistake bank" sub={`${data.mistakes.length} ta gap · 10 daq`} onPress={() => router.push('/english/drill/mistakes')} />
              <Row icon="🧩" title="Collocation" sub="10 daq · yangi 10 ta + takror" onPress={() => router.push('/english/vocab?kind=colloc')} />
              {day === 7 && <Row icon="📝" title="Haftalik test" sub="tez orada" />}
            </Card>

            <T bold size={18}>Hafta</T>
            {[1, 2, 3, 4, 5, 6, 7].filter((d) => d !== day).map((d) => {
              const p = dayPlan(d as DrillTopic['day']);
              return (
                <View key={d} style={{ gap: 8 }}>
                  <Pressable onPress={() => setOpenDay(openDay === d ? null : d)}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <T bold style={{ flex: 1 }}>{d}. {DAYS[d]}</T>
                      <T dim size={13}>{[...p.b1, ...p.b2].length} mavzu {openDay === d ? '▴' : '▾'}</T>
                    </Card>
                  </Pressable>
                  {openDay === d && (
                    <>
                      <Block title="B1" topics={p.b1} data={data} today={today} />
                      <Block title="B2" topics={p.b2} data={data} today={today} />
                    </>
                  )}
                </View>
              );
            })}

            <T bold size={18}>Barcha mavzular</T>
            <Card style={{ gap: 6 }}>
              {TOPICS.map((t) => {
                const st = statusOf(data.results, t.id);
                return (
                  <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T size={14} style={{ flex: 1 }} lines={1}>{t.title}</T>
                    <T size={12} bold color={STATUS[st].color}>{STATUS[st].label}</T>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Block({ title, topics, data, today }: { title: string; topics: DrillTopic[]; data: DrillData; today: string }) {
  const total = topics.reduce((a, t) => a + topicMinutes(t, statusOf(data.results, t.id)) + (t.speak ?? 0), 0);
  return (
    <Card style={{ gap: 8 }}>
      <T bold>{title} · ~{total} daq</T>
      {topics.map((t) => {
        const st = statusOf(data.results, t.id);
        const ready = !!contentOf(t.id);
        const done = doneOn(data.results, t.id, today);
        return (
          <Row key={t.id} icon={done ? '✅' : ready ? '▶︎' : '⏳'} title={t.title}
            sub={`${topicMinutes(t, st)} daq${t.speak ? ` + ${t.speak} speaking` : ''} · ${t.murphy}${ready ? '' : ' · kontent tez orada'}`}
            badge={STATUS[st]} onPress={ready ? () => router.push(`/english/drill/${t.id}`) : undefined} />
        );
      })}
    </Card>
  );
}

function Row({ icon, title, sub, badge, onPress }: {
  icon: string; title: string; sub: string; badge?: { label: string; color: string }; onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: !onPress ? 0.5 : pressed ? 0.7 : 1 }]}>
      <T size={18}>{icon}</T>
      <View style={{ flex: 1 }}>
        <T bold size={15}>{title}</T>
        <T dim size={12}>{sub}</T>
      </View>
      {badge && <T size={12} bold color={badge.color}>{badge.label}</T>}
    </Pressable>
  );
}
