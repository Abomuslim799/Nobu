/**
 * english/drill/index.tsx — "Bugun": hafta kuniga qarab faqat bugungi ish ro'yxati.
 *   Har band bosilsa — to'liq qo'llanma (Asos → Advanced, hiylalar, xatolar), grammar'da drill ham bor.
 *   Chapdagi doira — qo'lda belgilash; grammar drill tugasa — avtomatik ✅.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayKey } from '@/core/date';
import { C } from '@/core/theme';
import { Card, T } from '@/core/ui/kit';
import { STATUS, dayPlan, doneOn, phaseOf, statusOf, topicMinutes, weekOf, weekday } from '@/features/english/drill/logic';
import { toggleCheck, useDrill } from '@/features/english/drill/store';
import { START, WEEKS, type DrillTopic } from '@/features/english/drill/topics';
import { ALL_GUIDES, DAY_EXTRA, guideOf, minutesOf } from '@/features/english/guide/guide';
import { s } from '@/features/english/practice/kit';

const DAYS = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const SKILL_ICON: Record<string, string> = { 'sk-listening': '🎧', 'sk-reading': '📖', 'sk-writing': '✍️', 'sk-review': '📝' };

interface Item { id: string; icon: string; title: string; sub: string; done: boolean; go: () => void; badge?: { label: string; color: string } }

export default function Today() {
  const insets = useSafeAreaInsets();
  const { data, reload } = useDrill();
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const [all, setAll] = useState(false);

  const today = dayKey();
  const week = weekOf(today);
  const phase = phaseOf(Math.max(1, week));
  const day = weekday(today);

  if (!data) return <View style={[s.root, { paddingTop: insets.top }]} />;

  const checks = data.checks[today] ?? [];
  const guide = (id: string) => () => router.push(`/english/guide/${id}`);
  const extra = DAY_EXTRA[day];

  const grammar = (topics: DrillTopic[]): Item[] => topics.map((t) => {
    const st = statusOf(data.results, t.id);
    return {
      id: t.id, icon: '📘', title: t.title,
      sub: `${topicMinutes(t, st)} daq${t.speak ? ` + ${t.speak} speaking` : ''} · ${t.murphy}`,
      done: doneOn(data.results, t.id, today) || checks.includes(t.id), go: guide(t.id), badge: STATUS[st],
    };
  });
  const fromGuide = (id: string, icon: string): Item => {
    const g = guideOf(id);
    return { id, icon, title: g?.title ?? id, sub: g ? `~${minutesOf(g)} daq` : '', done: checks.includes(id), go: guide(id) };
  };

  const plan = dayPlan(day);
  const groups: { title: string; items: Item[] }[] = [
    { title: 'Grammar · 1-blok', items: grammar(plan.b1) },
    { title: 'Grammar · 2-blok', items: grammar(plan.b2) },
    { title: 'Speaking va talaffuz', items: [fromGuide(extra.speak, '🗣'), fromGuide(extra.pron, '👄')] },
    { title: "Ko'nikma", items: [fromGuide(extra.skill, SKILL_ICON[extra.skill] ?? '📚')] },
    {
      title: "So'zlar va xatolar", items: [
        fromGuide('vocab', '💡'),
        { id: 'do:vocab', icon: '🔤', title: "So'zlar: yangi + takror", sub: '30 so\'z · ilovada', done: checks.includes('do:vocab'), go: () => router.push('/english/vocab') },
        { id: 'do:colloc', icon: '🧩', title: 'Collocation', sub: '10 ta yangi + takror', done: checks.includes('do:colloc'), go: () => router.push('/english/vocab?kind=colloc') },
        { id: 'do:mistakes', icon: '🔁', title: 'Mistake bank', sub: `${data.mistakes.length} ta gap`, done: checks.includes('do:mistakes'), go: () => router.push('/english/drill/mistakes') },
      ],
    },
  ];
  const flat = groups.flatMap((g) => g.items);
  const doneN = flat.filter((i) => i.done).length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>📅 Bugun — {DAYS[day]}</T>
        <Pressable onPress={() => router.push({ pathname: '/nobu/chat', params: { key: 'drill:' } })} hitSlop={10}>
          <T size={15} color={C.green}>❓ Savol</T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        <Card style={{ gap: 4 }}>
          <T bold size={16}>{week ? `${week}/${WEEKS}-hafta · ${phase.name}` : `Reja ${START} dushanbadan boshlanadi`}</T>
          <T dim size={13}>{phase.about}</T>
          <T size={14} color={doneN === flat.length ? C.good : C.text}>Bajarildi: {doneN}/{flat.length}</T>
        </Card>

        {groups.map((g) => (
          <Card key={g.title} style={{ gap: 12 }}>
            <T bold dim size={13}>{g.title.toUpperCase()}</T>
            {g.items.map((it) => (
              <Row key={it.id} it={it} onCheck={it.id.startsWith('do:') || !doneOn(data.results, it.id, today)
                ? () => { toggleCheck(today, it.id).then(reload); } : undefined} />
            ))}
          </Card>
        ))}

        <Pressable onPress={() => setAll(!all)} hitSlop={8}>
          <T dim size={13} style={{ textAlign: 'center' }}>Barcha qo'llanmalar {all ? '▴' : '▾'}</T>
        </Pressable>
        {all && (
          <Card style={{ gap: 10 }}>
            {ALL_GUIDES.map((g) => (
              <Pressable key={g.id} onPress={guide(g.id)}><T size={14}>{g.title}</T></Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ it, onCheck }: { it: Item; onCheck?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable onPress={onCheck} disabled={!onCheck} hitSlop={10}
        style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
          borderColor: it.done ? C.good : C.subtle2, backgroundColor: it.done ? C.good : 'transparent' }}>
        {it.done && <T size={13} bold color={C.bg}>✓</T>}
      </Pressable>
      <Pressable onPress={it.go} style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.6 : 1 }]}>
        <T size={18}>{it.icon}</T>
        <View style={{ flex: 1 }}>
          <T bold size={15} style={it.done ? { color: C.dim } : undefined}>{it.title}</T>
          {!!it.sub && <T dim size={12}>{it.sub}</T>}
        </View>
        {it.badge && <T size={12} bold color={it.badge.color}>{it.badge.label}</T>}
        <T dim size={16}>›</T>
      </Pressable>
    </View>
  );
}
