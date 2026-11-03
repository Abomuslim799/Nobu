/**
 * v2/[id].tsx — Farobiy metodikasi (v2) darsi: rejim tanlash (🌱 Urug' · 🌿 Nihol · 🌳 Daraxt) → qadamlar → natija va 4 yo'l.
 * Chuqurroq rejimga qaytilganda — 30 soniyalik eslatma, o'tilgan qism takrorlanmaydi.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KEYS } from '@/core/storage';
import { C, FONT_DISPLAY } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { logScience } from '@/features/science/log';
import { Runner, type RunResult } from '@/features/lesson2/runner';
import { PASS } from '@/features/lesson2/feynman';
import { TOPICS2 } from '@/features/lesson2/topics';
import { MODES, MODE_INFO, type Mode, type Step } from '@/features/lesson2/types';

type Saved = { done: Partial<Record<Mode, { correct: number; total: number; at: number }>>; feyn?: number };
type Phase = { k: 'pick' } | { k: 'run'; mode: Mode; steps: Step[]; key: number } | { k: 'end'; mode: Mode; r: RunResult };

export default function LessonV2() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = TOPICS2[id];
  const [saved, setSaved] = useState<Saved>({ done: {} });
  const [phase, setPhase] = useState<Phase>({ k: 'pick' });
  const key = KEYS.v2(id);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => { try { if (raw) setSaved({ done: {}, ...JSON.parse(raw) }); } catch { /* buzilgan — boshidan */ } });
  }, [key]);
  if (!topic) return <View style={{ flex: 1, backgroundColor: C.bg }}><T>Dars topilmadi</T></View>;

  const start = (mode: Mode) => {
    const lower = MODES.slice(0, MODES.indexOf(mode)).some((m) => saved.done[m]);
    setPhase({ k: 'run', mode, steps: [...(lower ? [topic.recap] : []), ...topic.modes[mode]()], key: Date.now() });
  };
  const done = (mode: Mode, r: RunResult) => {
    const s: Saved = { ...saved, done: { ...saved.done, [mode]: { correct: r.correct, total: r.total, at: Date.now() } } };
    if (typeof r.feyn === 'number') s.feyn = Math.max(saved.feyn ?? 0, r.feyn);
    setSaved(s);
    AsyncStorage.setItem(key, JSON.stringify(s)).catch(() => {});
    logScience({ lesson: `v2-${topic.id}-${mode}`, area: 'math', title: `${topic.title} · ${MODE_INFO[mode].name}`, correct: r.correct, total: r.total,
      predicted: 0, predictTotal: 0, mistakes: r.mistakes });
    setPhase({ k: 'end', mode, r });
  };
  const status = (m: Mode) => (m === 'high' ? (saved.feyn ?? 0) >= PASS && !!saved.done.high : !!saved.done[m]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => (phase.k === 'run' ? setPhase({ k: 'pick' }) : router.back())} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T dim size={12}>{topic.subject} · 🧪 v2</T>
          <T bold size={16}>{topic.title}{phase.k !== 'pick' ? ` · ${MODE_INFO[phase.mode].icon} ${MODE_INFO[phase.mode].name}` : ''}</T>
        </View>
      </View>

      {phase.k === 'run' && <Runner key={phase.key} topic={topic} steps={phase.steps} onDone={(r) => done(phase.mode, r)} />}

      {phase.k === 'pick' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 30 }}>
          <Card style={{ gap: 4 }}>
            <T dim size={12}>Katta g'oya</T>
            <T size={17} style={{ fontFamily: FONT_DISPLAY }}>{topic.idea}</T>
          </Card>
          <T bold>Bugun qancha vaqtingiz bor?</T>
          {MODES.map((m) => {
            const d = saved.done[m], ok = status(m);
            return (
              <Pressable key={m} onPress={() => start(m)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
                borderRadius: 18, backgroundColor: C.card, borderWidth: 1.5, borderColor: ok ? C.good : C.cardBorder })}>
                <T size={34}>{MODE_INFO[m].icon}</T>
                <View style={{ flex: 1 }}>
                  <T bold size={18}>{MODE_INFO[m].name}</T>
                  <T dim size={13}>{MODE_INFO[m].time} · {m === 'low' ? 'umumiy tushuncha' : m === 'medium' ? 'asoslar chuqurroq' : "mavzu to'liq + o'zing tushuntirasan"}</T>
                  {d && <T size={12} color={ok ? C.good : C.gold}>{ok ? '✓ ' : ''}{d.correct}/{d.total}{m === 'high' ? ` · Feynman ${saved.feyn ?? '—'}` : ''}</T>}
                </View>
                <T dim>›</T>
              </Pressable>
            );
          })}
          <T dim size={12}>Rejim — bitta mavzuning chuqurligi. Avval o'tgan qism qayta o'tilmaydi: chuqurroq rejimda 30 soniyalik eslatma beriladi.</T>
        </ScrollView>
      )}

      {phase.k === 'end' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 30 }}>
          <Card style={{ alignItems: 'center', gap: 6 }}>
            <T size={44}>{MODE_INFO[phase.mode].icon}</T>
            <T bold size={20}>{MODE_INFO[phase.mode].name} o'tildi</T>
            <T dim>Birinchi urinishda to'g'ri: {phase.r.correct} / {phase.r.total}</T>
            {typeof phase.r.feyn === 'number' && <T color={phase.r.feyn >= PASS ? C.good : C.gold}>Feynman: {phase.r.feyn} ball</T>}
          </Card>
          {phase.r.mistakes.length > 0 && (
            <Card style={{ gap: 4 }}>
              <T bold>Xato bo'lgan savollar</T>
              {phase.r.mistakes.map((m, i) => <T key={i} dim size={14}>• {m}</T>)}
            </Card>
          )}
          <T bold>Endi nima qilamiz?</T>
          <Button kind="ghost" label={`➡️ Keyingi mavzu: ${topic.next ?? '—'} (tez orada)`} disabled onPress={() => {}} />
          {MODES.filter((m) => m !== phase.mode).map((m) => (
            <Button key={m} kind="ghost" label={`${MODE_INFO[m].icon} ${MODE_INFO[m].name} — ${MODE_INFO[m].time}`} onPress={() => start(m)} />
          ))}
          <Button label="☕ Dam olish" onPress={() => router.back()} />
        </ScrollView>
      )}
    </View>
  );
}
