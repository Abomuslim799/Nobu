/**
 * v2/[id].tsx — Farobiy metodikasi (v2) darsi: rejim tanlash (🌱 Urug' · 🌿 Nihol · 🌳 Daraxt) → qadamlar → natija va keyingi yo'l.
 * Chuqurroq rejimga qaytilganda — 30 soniyalik eslatma. Natijadan keyin faqat yuqoriroq rejimlar taklif qilinadi.
 * 🌳 — Daraxt rejimida test ≥ 80% va Feynman ≥ 70. Xato qilingan savollar — "Xatolarni qayta ishlash" (shablonlar yangi raqamlar bilan).
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
import { MASTERY, MODES, MODE_INFO, type Mode, type Step } from '@/features/lesson2/types';

type Done = { correct: number; total: number; at: number };
type Saved = { done: Partial<Record<Mode, Done>>; feyn?: number };
type Phase =
  | { k: 'pick' }
  | { k: 'run'; mode: Mode; steps: Step[]; key: number; drill?: boolean }
  | { k: 'end'; mode: Mode; r: RunResult; drill?: boolean };

const pct = (d?: { correct: number; total: number }) => (d && d.total ? d.correct / d.total : 0);
const P = (x: number) => `${Math.round(x * 100)}%`;

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

  const mastered = (s: Saved) => (s.feyn ?? 0) >= PASS && pct(s.done.high) >= MASTERY;
  const start = (mode: Mode) => {
    const lower = MODES.slice(0, MODES.indexOf(mode)).some((m) => saved.done[m]);
    setPhase({ k: 'run', mode, steps: [...(lower ? [topic.recap] : []), ...topic.modes[mode]()], key: Date.now() });
  };
  const drill = (mode: Mode, missed: Step[]) =>
    setPhase({ k: 'run', mode, drill: true, key: Date.now(), steps: missed.map((s) => (s.regen ? s.regen() : s)) });

  const done = (mode: Mode, r: RunResult, isDrill?: boolean) => {
    if (!isDrill) {
      const prev = saved.done[mode];
      const best = !prev || pct(r) >= pct(prev) ? { correct: r.correct, total: r.total, at: Date.now() } : prev;   // eng yaxshi natija saqlanadi
      const s: Saved = { ...saved, done: { ...saved.done, [mode]: best } };
      if (typeof r.feyn === 'number') s.feyn = Math.max(saved.feyn ?? 0, r.feyn);
      setSaved(s);
      AsyncStorage.setItem(key, JSON.stringify(s)).catch(() => {});
    }
    logScience({ lesson: `v2-${topic.id}-${mode}${isDrill ? '-xato' : ''}`, area: 'math', title: `${topic.title} · ${MODE_INFO[mode].name}${isDrill ? ' (xatolar)' : ''}`,
      correct: r.correct, total: r.total, predicted: 0, predictTotal: 0, mistakes: r.mistakes });
    setPhase({ k: 'end', mode, r, drill: isDrill });
  };
  const status = (m: Mode) => (m === 'high' ? mastered(saved) : !!saved.done[m]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => (phase.k === 'run' ? setPhase({ k: 'pick' }) : router.back())} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T dim size={12}>{topic.subject} · 🧪 v2</T>
          <T bold size={16}>{topic.title}{phase.k !== 'pick' ? ` · ${MODE_INFO[phase.mode].icon} ${phase.drill ? 'Xatolar' : MODE_INFO[phase.mode].name}` : ''}</T>
        </View>
      </View>

      {phase.k === 'run' && <Runner key={phase.key} topic={topic} steps={phase.steps} onDone={(r) => done(phase.mode, r, phase.drill)} />}

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
                  {d && <T size={12} color={ok ? C.good : C.gold}>{ok ? '✓ ' : ''}{P(pct(d))}{m === 'high' ? ` · Feynman ${saved.feyn ?? '—'}${ok ? '' : ` · 🌳 uchun: test ${P(MASTERY)}+, Feynman ${PASS}+`}` : ''}</T>}
                </View>
                <T dim>›</T>
              </Pressable>
            );
          })}
          <T dim size={12}>Rejim — bitta mavzuning chuqurligi. Avval o'tgan qism qayta o'tilmaydi: chuqurroq rejimda 30 soniyalik eslatma beriladi.</T>
        </ScrollView>
      )}

      {phase.k === 'end' && (() => {
        const { mode, r } = phase;
        const p = pct(r), feyn = typeof r.feyn === 'number' ? r.feyn : saved.feyn;
        const isHigh = mode === 'high' && !phase.drill;
        const grown = isHigh && p >= MASTERY && (feyn ?? 0) >= PASS;
        const higher = MODES.slice(MODES.indexOf(mode) + 1);
        return (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 30 }}>
            <Card style={{ alignItems: 'center', gap: 6 }}>
              <T size={44}>{phase.drill ? '🔁' : isHigh && !grown ? '🌿' : MODE_INFO[mode].icon}</T>
              <T bold size={20} style={{ textAlign: 'center' }}>
                {phase.drill ? 'Xatolar qayta ishlandi' : !isHigh ? `${MODE_INFO[mode].name} o'tildi` : grown ? "🌳 Daraxt o'sdi — mavzu to'liq o'zlashtirildi" : "Daraxt tugatildi — 🌳 uchun yetmadi"}
              </T>
              <T dim>Birinchi urinishda to'g'ri: {r.correct} / {r.total} ({P(p)})</T>
              {isHigh && (
                <View style={{ gap: 2, alignItems: 'center' }}>
                  <T size={14} color={p >= MASTERY ? C.good : C.red}>{p >= MASTERY ? '✓' : '✗'} Test: {P(p)} (kerak {P(MASTERY)})</T>
                  <T size={14} color={(feyn ?? 0) >= PASS ? C.good : C.red}>{(feyn ?? 0) >= PASS ? '✓' : '✗'} Feynman: {feyn ?? '—'} (kerak {PASS})</T>
                </View>
              )}
            </Card>
            {r.mistakes.length > 0 && (
              <Card style={{ gap: 4 }}>
                <T bold>Xato bo'lgan savollar</T>
                {r.mistakes.map((m, i) => <T key={i} dim size={14}>• {m}</T>)}
              </Card>
            )}
            <T bold>Endi nima qilamiz?</T>
            {r.missed.length > 0 && <Button label={`🔁 Xatolarni qayta ishlash (${r.missed.length})`} onPress={() => drill(mode, r.missed)} />}
            {higher.map((m) => (
              <Button key={m} kind="ghost" label={`${MODE_INFO[m].icon} ${MODE_INFO[m].name} — ${MODE_INFO[m].time}`} onPress={() => start(m)} />
            ))}
            <Button kind="ghost" label={`➡️ Keyingi mavzu: ${topic.next ?? '—'} (tez orada)`} disabled onPress={() => {}} />
            <Button kind={r.missed.length ? 'ghost' : 'primary'} label="☕ Dam olish" onPress={() => router.back()} />
          </ScrollView>
        );
      })()}
    </View>
  );
}
