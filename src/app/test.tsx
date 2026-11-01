/**
 * test.tsx — Kunlik test (10 savol: ingliz 4, matematika 2, geometriya 2, fizika 2).
 *   Har savolga vaqt chegarasi; vaqt tugasa — xato. Faqat birinchi javob hisoblanadi.
 *   Natija FR ga yoziladi (kunlik test — kichik ta'sir). Bugun ikkinchi marta — mashq (FR o'zgarmaydi).
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT_DISPLAY, PAD } from '@/core/theme';
import { fmtN } from '@/features/assessment/astrolabe';
import { useRating, type TestItem, type TestLog } from '@/core/store';
import { fmtDur , dayKey } from '@/core/date';
import { dailyTest, seeded, type Q } from '@/features/assessment/questions';
import { AREA_META, maxPoints, type Area } from '@/features/assessment/rating';
import { Button, Card, T } from '@/core/ui/kit';
import { UstozPicture } from '@/core/ui/avatar';

const LEVEL = (d: number) => (d < 1000 ? 'oson' : d < 1300 ? "o'rta" : d < 1600 ? 'qiyin' : 'juda qiyin');
const buzz = (ok: boolean) => {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
};

export default function TestScreen() {
  const rating = useRating();
  const insets = useSafeAreaInsets();
  const [practice] = useState(() => !!rating.dailyDone);     // ochilgan paytdagi holat (natijadan keyin o'zgarmasin)
  const [qs] = useState<Q[]>(() =>
    dailyTest(seeded(practice ? `p${Date.now()}` : `daily:${dayKey()}`), rating.m.fr, practice ? {} : rating.m.seen, rating.m.disabled));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);      // -1 — vaqt tugadi
  const [items, setItems] = useState<TestItem[]>([]);
  const [left, setLeft] = useState(qs[0]?.sec ?? 30);
  const [combo, setCombo] = useState(0);
  const [quit, setQuit] = useState(false);
  const [result, setResult] = useState<TestLog | null>(null);
  const t0 = useRef(Date.now());
  const pop = useRef(new Animated.Value(0)).current;
  const q = qs[i];

  // Savol taymeri
  useEffect(() => {
    if (picked !== null || result || !q) return;
    const id = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [i, picked, result, q]);
  useEffect(() => { if (left <= 0 && picked === null && q) answer(-1); }, [left]);    

  const answer = (k: number) => {
    if (picked !== null) return;
    const cur = qs[i];
    const ok = k === cur.ans;
    setPicked(k);
    buzz(ok);
    setItems((xs) => [...xs, { q: cur, s: ok ? 1 : 0 }]);
    setCombo((c) => (ok ? c + 1 : 0));
    if (ok) {
      pop.setValue(0);
      Animated.timing(pop, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  };

  const finish = (all: TestItem[]) => {
    const kind = practice ? 'practice' : 'daily';
    setResult(rating.recordTest(kind, all, Math.round((Date.now() - t0.current) / 1000)));
  };
  const next = () => {
    if (i + 1 >= qs.length) { finish(items); return; }
    setI(i + 1); setPicked(null); setLeft(qs[i + 1].sec);
  };
  const close = () => {
    if (result || !items.length) { router.back(); return; }
    if (!quit) { setQuit(true); return; }
    finish(items);
  };

  const top = (
    <View style={s.top}>
      <Pressable onPress={close} hitSlop={12}><T size={22}>✕</T></Pressable>
      <View style={s.chip}><T size={13} bold>{practice ? 'Mashq' : 'Kunlik test'} · {Math.min(i + 1, qs.length)}/{qs.length}</T></View>
      <View style={[s.chip, { backgroundColor: C.goldSoft }]}><T size={13} bold color={C.gold}>🔥 {combo}</T></View>
    </View>
  );

  if (result) return <Result r={result} items={items} practice={practice} pad={insets} />;
  if (!q) return <View style={[s.root, { paddingTop: insets.top }]}>{top}<T dim style={{ padding: PAD }}>Savol topilmadi</T></View>;

  const ok = picked !== null && picked === q.ans;
  const frac = (i + (picked !== null ? 1 : 0)) / qs.length;
  return (
    <View style={[s.root, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
      {top}
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={s.track}><View style={[s.fill, { width: `${frac * 100}%` }]} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <T dim size={13} style={{ flex: 1 }}>{AREA_META[q.area].title} · {q.topic} · {LEVEL(q.d)} · {maxPoints(q.d)} ball</T>
          <T size={14} bold color={left <= 5 && picked === null ? C.red : C.dim} style={{ fontVariant: ['tabular-nums'], minWidth: 40, textAlign: 'right' }}>
            {picked === null ? `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}` : ''}</T>
        </View>

        <Card style={{ padding: 18 }}>
          <Text style={s.q}>{q.q}</Text>
          {ok && (
            <Animated.Text style={[s.float, { opacity: pop.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [6, -22] }) }] }]}>+{maxPoints(q.d)} ball</Animated.Text>
          )}
        </Card>

        <View style={{ gap: 10 }}>
          {q.opts.map((o, k) => {
            const isAns = k === q.ans, mine = k === picked;
            const st = picked === null ? null : isAns ? s.optOk : mine ? s.optBad : s.optDim;
            return (
              <Pressable key={k} onPress={() => answer(k)} disabled={picked !== null}
                style={({ pressed }) => [s.opt, st, pressed && { opacity: 0.7 }]}>
                <Text style={[s.optT, picked !== null && isAns && { color: C.good }, mine && !isAns && { color: C.red }]}>
                  {o}{picked !== null && isAns ? '  ✓' : mine && !isAns ? '  ✗' : ''}</Text>
              </Pressable>
            );
          })}
        </View>

        {picked !== null && (
          <View style={[s.why, { backgroundColor: ok ? 'rgba(74,222,128,0.10)' : C.redSoft }]}>
            <T bold color={ok ? C.good : C.red}>{ok ? (combo >= 3 ? `Barakalla! ${combo} ta ketma-ket` : 'Barakalla!') : picked === -1 ? 'Vaqt tugadi' : "To'g'ri javob boshqa"}</T>
            <T size={14}>{q.why}</T>
          </View>
        )}
        {quit && picked === null && (
          <T dim size={13} style={{ textAlign: 'center' }}>Chiqish uchun ✕ ni yana bosing — javob berilgan {items.length} ta savol hisoblanadi.</T>
        )}
      </ScrollView>
      {picked !== null && (
        <View style={{ paddingHorizontal: PAD }}>
          <Button label={i + 1 >= qs.length ? 'Natija' : 'Keyingi savol ›'} onPress={next} />
        </View>
      )}
    </View>
  );
}

function Result({ r, items, practice, pad }: { r: TestLog; items: TestItem[]; practice: boolean; pad: { top: number; bottom: number } }) {
  const rating = useRating();
  const d = Math.round(r.after - r.before);
  const pct = r.n ? r.ok / r.n : 0;
  const wrong = useMemo(() => [...new Set(items.filter((x) => x.s < 1).map((x) => `${AREA_META[x.q.area].title}: ${x.q.topic}`))], [items]);
  const pose = pct >= 0.8 ? 'tushuntir' : pct >= 0.5 ? 'kitob' : 'oyla';
  const say = pct === 1 ? "Hammasi to'g'ri. Ertaga biroz qiyinroq savollar beraman."
    : wrong.length ? `Shularni takrorlaymiz: ${wrong.slice(0, 3).join('; ')}.` : 'Yaxshi boshlanish.';
  return (
    <View style={[s.root, { paddingTop: pad.top + 8, paddingBottom: pad.bottom + 8 }]}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <UstozPicture pose={pose} height={150} />
          <Text style={[s.q, { fontSize: 24, textAlign: 'center' }]}>{practice ? 'Mashq tugadi' : 'Kunlik test tugadi'}</Text>
          <T dim>{r.ok}/{r.n} to'g'ri · {Math.floor(r.sec / 60)} daq {r.sec % 60} s</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <T size={22} bold color={C.gold}>{rating.todayXP} XP</T>
            <T dim size={12}>bugun · {fmtDur(rating.todaySec)}</T>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <T size={22} bold color={practice ? C.dim : d >= 0 ? C.green : C.red}>{practice ? '—' : `${d >= 0 ? '+' : ''}${d} FR`}</T>
            <T dim size={12}>{practice ? 'mashqda FR o\'zgarmaydi' : `${fmtN(r.before)} → ${fmtN(r.after)}`}</T>
          </Card>
        </View>
        <Card style={{ gap: 8 }}>
          {(Object.keys(r.by) as Area[]).map((a) => {
            const b = r.by[a]!;
            return (
              <View key={a} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <T style={{ flex: 1 }}>{AREA_META[a].title}</T>
                <T dim style={{ width: 48, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{b.ok}/{b.n}</T>
                {!practice && <T bold color={b.d >= 0 ? C.good : C.red} style={{ width: 48, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{b.d >= 0 ? '+' : ''}{b.d}</T>}
              </View>
            );
          })}
        </Card>
        <View style={s.say}>
          <T bold size={13} color={C.gold}>USTOZ FAROBIY</T>
          <T size={15}>{say}</T>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: PAD }}><Button label="Davom etish" onPress={() => router.back()} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingVertical: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: C.subtle },
  body: { padding: PAD, gap: 14, paddingBottom: 24 },
  track: { height: 6, borderRadius: 3, backgroundColor: C.subtle2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  q: { color: C.text, fontFamily: FONT_DISPLAY, fontSize: 20, lineHeight: 28 },
  float: { position: 'absolute', right: 14, top: -10, color: C.gold, fontWeight: '800', fontSize: 15 },
  opt: { minHeight: 54, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  optT: { color: C.text, fontSize: 17, fontWeight: '600' },
  optOk: { borderColor: C.good, borderWidth: 2, backgroundColor: 'rgba(74,222,128,0.10)' },
  optBad: { borderColor: C.red, borderWidth: 2, backgroundColor: C.redSoft },
  optDim: { opacity: 0.55 },
  why: { padding: 14, borderRadius: 14, gap: 4 },
  say: { padding: 14, borderRadius: 14, gap: 4, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.cardBorder },
});
