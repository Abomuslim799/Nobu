/**
 * Taqsimot — saralanmagan yozuvlar: bittadan ko'rsatiladi, tanlovdan keyin karta suzib chiqadi, keyingisi kiradi.
 * Nafaqa/Nafs/Maqsad → kategoriya (do'kon eslab qolinadi), Kirim → yangi davr / joriy davrga, → Naqd, → Qora kun.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { CATS, COLOR, fmt, getPending, sortTx, walletShort, type Tx } from '@/features/bayt/api';
import { Chip, Head, Page } from '@/features/bayt/ui';

type Open = 'nafaqa' | 'nafs' | 'maqsad' | 'kirim' | null;
const CHOICES: { id: string; label: string; color: string }[] = [
  { id: 'nafaqa', label: 'Nafaqa', color: COLOR.nafaqa },
  { id: 'nafs', label: 'Nafs', color: COLOR.nafs },
  { id: 'maqsad', label: 'Maqsad', color: COLOR.maqsad },
  { id: 'kirim', label: 'Kirim', color: COLOR.kirim },
  { id: 'cash', label: '→ Naqd', color: COLOR.cash },
  { id: 'reserve', label: '→ Qora kun', color: COLOR.qora },
];

export default function Taqsimot() {
  const [items, setItems] = useState<Tx[] | null>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<Open>(null);
  const [err, setErr] = useState('');

  useEffect(() => { getPending().then(setItems).catch((e) => setErr(String(e.message ?? e))); }, []);

  const t = items?.[i];
  const total = items?.length ?? 0;
  const next = () => { setOpen(null); setI((x) => x + 1); };

  const act = async (action: string, extra: { category?: string; mode?: 'new' | 'add' } = {}) => {
    if (!t) return;
    try {
      await sortTx({ id: t.id, action, ...extra });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      next();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    }
  };

  const pick = (id: string) => {
    if (id === 'cash' || id === 'reserve') return act(id);
    setOpen((o) => (o === id ? null : (id as Open)));
  };

  const subs = open === 'kirim'
    ? [{ label: 'Yangi davr boshlash', go: () => act('income', { mode: 'new' }) },
       { label: "Joriy davrga qo'shish", go: () => act('income', { mode: 'add' }) }]
    : open ? CATS[open].map((c) => ({ label: c, go: () => act(open, { category: c }) })) : [];

  return (
    <Page>
      <Head title="Taqsimot" right={t ? <T dim size={13}>{i + 1} / {total}</T> : null} />
      <View style={s.track}>
        <View style={[s.fill, { width: `${total ? Math.round((Math.min(i + 1, total) / total) * 100) : 0}%` }]} />
      </View>
      {err ? <T size={13} color={C.red}>{err}</T> : null}
      {!items && !err ? <T dim>Yuklanmoqda…</T> : null}

      {t ? (
        <Animated.View key={t.id} entering={FadeInDown.duration(320)} exiting={FadeOutLeft.duration(200)} style={{ flex: 1, gap: 14 }}>
          <View style={s.card}>
            <View style={s.between}>
              <T dim size={12} style={{ letterSpacing: 1.2 }}>{t.kind === 'income' ? 'PUL TUSHDI' : "TO'LOV"}</T>
              <T dim size={12}>{t.ts.slice(8, 10)}.{t.ts.slice(5, 7)} · {t.ts.slice(11, 16)}</T>
            </View>
            <Text style={s.amount}>{t.kind === 'income' ? '+' : '−'}{fmt(t.amount)}</Text>
            <View style={s.between}>
              <T size={14} color={C.text} lines={1} style={{ flex: 1 }}>{t.place || "Joy noma'lum"}</T>
              <T size={14} dim>{walletShort(t.wallet)}</T>
            </View>
          </View>

          <View style={{ flex: 1 }} />
          <T dim size={13}>Bu nima edi?</T>
          {open ? (
            <Animated.View key={open} entering={FadeIn.duration(220)} layout={LinearTransition} style={s.wrap}>
              {subs.map((x) => <Chip key={x.label} label={x.label} onPress={x.go} />)}
            </Animated.View>
          ) : null}
          <View style={s.grid}>
            {CHOICES.map((c) => (
              <Pressable key={c.id} onPress={() => pick(c.id)}
                style={({ pressed }) => [s.choice, open === c.id && { borderColor: c.color, backgroundColor: C.surface2 }, pressed && { opacity: 0.75 }]}>
                <View style={[s.dot, { backgroundColor: c.color }]} />
                <Text style={s.choiceText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={next} style={s.later}><T dim size={14}>Keyinroq</T></Pressable>
        </Animated.View>
      ) : items ? (
        <Animated.View entering={FadeIn.duration(280)} style={s.done}>
          <View style={s.check}><Text style={{ color: C.gold, fontSize: 26 }}>✓</Text></View>
          <Text style={s.doneTitle}>{total ? 'Hammasi saralandi' : "Saralanadigan yozuv yo'q"}</Text>
          <T dim size={13}>Limitlar qayta hisoblandi</T>
        </Animated.View>
      ) : null}
    </Page>
  );
}

const s = StyleSheet.create({
  track: { height: 3, borderRadius: 2, backgroundColor: C.subtle, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: C.gold },
  card: { padding: 20, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.subtle2, gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  amount: { color: C.text, fontSize: 36, fontFamily: FONT_UI.b, letterSpacing: -0.5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: '31.9%', minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: C.subtle2, backgroundColor: C.card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  choiceText: { color: C.text, fontSize: 14, fontFamily: FONT_UI.sb },
  dot: { width: 8, height: 8, borderRadius: 4 },
  later: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.subtle2, alignItems: 'center', justifyContent: 'center' },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  check: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { color: C.text, fontFamily: FONT_INSCR, fontSize: 22 },
});
