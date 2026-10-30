/**
 * Bugun — streak, aniq kunlik reja (takror, movie qadami, zaif miya ko'nikmasi, shaxmat, kitob) va haftalik faollik.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAMES } from '@/data/games';
import { pushPlan } from '@/lib/sync';
import { BRAIN_SKILLS, brainStats, getBrainLog, type BrainEntry } from '@/lib/brain';

import { C } from '@/constants/theme';
import { ALL_LESSONS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { dayKey, lastDays } from '@/lib/streak';
import { AUDIO } from '@/data/audio';
import { quoteOfDay } from '@/lib/reading';
import { STEPS, UNITS, stepsDone } from '@/data/units';
import { FRIENDS } from '@/lib/edition';
import { VERSION } from '@/lib/version';
import { QuoteCard } from '@/ui/quote-card';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];   // Date.getDay(): 0 = yakshanba

export default function Today() {
  const { data, streak, best, today, todayRead } = useProgress();
  const readGoal = data.settings.readGoal;
  const quote = quoteOfDay(data.quotes);
  // Keyingi dars — hali tugatilmaganlarning birinchisi.
  const next = ALL_LESSONS.find(({ lesson }) => !data.lessons[lesson.id]);
  const unit = UNITS.find((u) => stepsDone(data.unitSteps[u.id]) < STEPS.length) ?? UNITS[0];
  const nextStep = STEPS.find((st) => !(data.unitSteps[unit.id] ?? []).includes(st.id)) ?? STEPS[0];

  // Miya jurnali — ekranga qaytganda yangilanadi
  const [log, setLog] = useState<BrainEntry[]>([]);
  useFocusEffect(useCallback(() => { getBrainLog().then(setLog); }, []));
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const todayLog = log.filter((e) => e.at >= start.getTime());

  // Eng zaif ko'nikma: hali o'ynalmagan yoki oxirgi natijalari eng past (shaxmat alohida rejada)
  const weak = brainStats(log).filter((x) => x.skill !== 'chess')
    .sort((a, b) => (a.count ? a.recent : -1) - (b.count ? b.recent : -1))[0];
  const weakGames = GAMES.filter((g) => g.skill === weak.skill && !g.ai);
  const weakGame = weakGames[new Date().getDate() % Math.max(1, weakGames.length)] ?? GAMES[1];
  const weakTitle = BRAIN_SKILLS.find((x) => x.id === weak.skill)?.title ?? '';

  const due = Object.values(data.cards).filter((c) => c.due <= Date.now()).length;
  const cardGoal = Math.min(20, Math.max(10, due + (today.cards ?? 0)));

  const goals = [
    { icon: '🎴', label: `So'z takrori · ${today.cards ?? 0}/${cardGoal}`, sub: due ? `${due} ta so'z takror kutmoqda` : 'Yangi so\'zlar',
      done: (today.cards ?? 0) >= cardGoal, go: () => router.push('/cards') },
    { icon: unit.emoji, label: `Movie: ${unit.source} — ${nextStep.title}`, sub: `${stepsDone(data.unitSteps[unit.id])}/${STEPS.length} qadam`,
      done: (today.steps ?? 0) >= 1, go: () => router.push(`/unit/${unit.id}`) },
    ...(FRIENDS ? [] : [
      { icon: weakGame.icon, label: `Miya: ${weakGame.title}`, sub: `zaif tomon — ${weakTitle}${weak.count ? ` (oxirgi ${weak.recent}%)` : ' (hali sinalmagan)'}`,
        done: todayLog.some((e) => e.skill !== 'chess'), go: () => router.push(`/game/${weakGame.id}`) },
      { icon: '♟️', label: 'Shaxmat: 5 masala', sub: 'taktika — har kuni',
        done: todayLog.some((e) => e.skill === 'chess'), go: () => router.push('/game/chess') },
      { icon: '📚', label: `Kitob · ${todayRead}/${readGoal} daq`, sub: data.activeRead ? "o'qilmoqda" : '',
        done: todayRead >= readGoal, go: () => router.push(data.activeRead ? `/book/${data.activeRead.bookId}` : '/library') },
    ]),
  ];
  const goalDone = goals.filter((g) => g.done).length;
  const leftKey = goals.filter((g) => !g.done).map((g) => `${g.icon} ${g.label}`).join('|');
  useEffect(() => {
    pushPlan({ done: goalDone, total: goals.length, left: leftKey ? leftKey.split('|') : [] });
  }, [goalDone, goals.length, leftKey]);

  return (
    <Screen>
      <Title sub="Har kuni oz-ozdan — ming kunda usta.">Bugun</Title>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Text style={s.fire}>{streak > 0 ? '🔥' : '🪵'}</Text>
        <View style={{ flex: 1 }}>
          <T size={28} bold>{streak} kun</T>
          <T dim>{streak > 0 ? `Seriya davom etmoqda · rekord ${best}` : 'Bugun boshlang — seriya 1 dan'}</T>
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <T bold>{goalDone === goals.length ? '✅ Bugungi reja bajarildi' : `Bugungi reja · ${goalDone}/${goals.length}`}</T>
        <Bar value={goalDone / goals.length} />
        {goals.map((g) => (
          <Pressable key={g.label} onPress={g.go} style={({ pressed }) => [s.row, g.done && s.rowDone, pressed && { opacity: 0.7 }]}>
            <Text style={{ fontSize: 22 }}>{g.done ? '✅' : g.icon}</Text>
            <View style={{ flex: 1 }}>
              <T bold={!g.done} dim={g.done} size={15}>{g.label}</T>
              {!!g.sub && <T dim size={12}>{g.sub}</T>}
            </View>
            {!g.done && <T dim>›</T>}
          </Pressable>
        ))}
        <T dim size={12}>{today.xp} XP bugun</T>
      </Card>

      <Card>
        <T dim>Haftalik faollik</T>
        <View style={s.week}>
          {lastDays(7).map((day) => {
            const [y, m, d] = day.split('-').map(Number);
            const active = !!data.days[day];
            return (
              <View key={day} style={{ alignItems: 'center', gap: 6 }}>
                <View style={[s.dot, active && s.dotOn, day === dayKey() && s.dotToday]} />
                <T dim size={12}>{WEEKDAYS[new Date(y, m - 1, d).getDay()]}</T>
              </View>
            );
          })}
        </View>
      </Card>


      {!FRIENDS && quote ? <QuoteCard q={quote} book={data.books.find((b) => b.id === quote.bookId)?.title} /> : null}


      {FRIENDS ? null : next ? (
        <Card>
          <T dim>Keyingi dars · {next.track.icon} {next.track.title}</T>
          <T size={18} bold>{next.lesson.title}</T>
          <T dim>~{next.lesson.minutes} daqiqa</T>
          <Button label="Boshlash" onPress={() => router.push(`/lesson/${next.lesson.id}`)} />
        </Card>
      ) : (
        <Card><T>Barcha darslar tugadi. Yangilari tez orada!</T></Card>
      )}

      <T dim size={12}>Nobu v{VERSION} · ovoz: {Object.keys(AUDIO).length ? `Ryan (${Object.keys(AUDIO).length} so'z)` : 'telefon'}</T>
    </Screen>
  );
}

const s = StyleSheet.create({
  fire: { fontSize: 44 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  rowDone: { opacity: 0.6 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)' },
  dotOn: { backgroundColor: C.green },
  dotToday: { borderWidth: 2, borderColor: C.fire },
});
