/**
 * Bayt ul-mol — moliya: bugungi Nafaqa limiti, haftalik Nafs, Maqsad va Qora kun fondlari, Taqsimot, Devon.
 * Ma'lumot serverdan (/api/farobiy/bayt/summary); ekranga qaytganda yangilanadi.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT_INSCR, FONT_UI } from '@/core/theme';
import { Bar, Card, Screen, T } from '@/core/ui/kit';
import { COLOR, dayLabel, deleteTx, fmt, getDevon, getSummary, LABEL, walletShort, type Summary, type Tx } from '@/features/bayt/api';

export default function Bayt() {
  const insets = useSafeAreaInsets();
  const [sum, setSum] = useState<Summary | null>(null);
  const [devon, setDevon] = useState<Tx[]>([]);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    Promise.all([getSummary(), getDevon(6)])
      .then(([s, d]) => { setSum(s); setDevon(d); setErr(''); })
      .catch((e) => setErr(String(e.message ?? e)));
  }, []);
  useFocusEffect(load);

  /** Uzoq bosilganda — xato yozuvni o'chirish (tasdiq bilan). */
  const remove = (t: Tx) => Alert.alert("Yozuvni o'chirish?", `${fmt(t.amount)} so'm · ${t.category || t.place || t.kind}`, [
    { text: 'Bekor', style: 'cancel' },
    { text: "O'chirish", style: 'destructive', onPress: () => { deleteTx(t.id).then(load).catch((e) => setErr(String(e.message ?? e))); } },
  ]);

  const p = sum?.period;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen>
        <View style={s.head}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>Bayt ul-mol</Text>
            {p ? <T dim size={13}>{dayLabel(p.start)} — {dayLabel(p.checkpoint)} · {p.days_left} kun qoldi</T> : null}
          </View>
          <Pressable onPress={() => router.push('/bayt/kirim')} accessibilityLabel="Yangi kirim" style={s.round}>
            <Text style={{ color: COLOR.kirim, fontSize: 18 }}>↓</Text>
          </Pressable>
        </View>

        {err ? <Card><T color={C.red}>{err}</T></Card> : null}
        {!sum && !err ? <T dim>Yuklanmoqda…</T> : null}

        {sum && !p ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
              <T size={16} bold>Hali davr ochilmagan</T>
              <T dim size={13} style={{ textAlign: 'center' }}>Birinchi kirimni kiriting — pul 50/30/15/5 bo'yicha taqsimlanadi.</T>
              <Pressable onPress={() => router.push('/bayt/kirim')} style={[s.cta, { backgroundColor: C.gold }]}>
                <Text style={s.ctaText}>Kirim kiritish</Text>
              </Pressable>
            </Card>
          </Animated.View>
        ) : null}

        {sum && p ? (
          <>
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={s.balance}>
                <View style={{ gap: 2 }}>
                  <T dim size={12}>Sarflash mumkin</T>
                  <T size={18} bold>{fmt(p.spendable)}</T>
                </View>
                <View style={s.vline} />
                <View style={{ gap: 2, alignItems: 'flex-end' }}>
                  <T dim size={12}>Umumiy</T>
                  <T size={18} bold>{fmt(sum.total)}</T>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).duration(320)}>
              <Card style={s.hero}>
                <Text style={[s.kicker, { color: COLOR.nafaqa }]}>BUGUN · NAFAQA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={[s.big, p.nafaqa.today_left < 0 && { color: C.red }]}>{fmt(p.nafaqa.today_left)}</Text>
                  <T dim size={15}>so'm</T>
                </View>
                <T dim size={13}>{p.nafaqa.today_left < 0 ? "limitdan oshdi — qolgan kunlarga yoyiladi" : 'bugun sarflash mumkin'}</T>
                <View style={{ alignSelf: 'stretch', gap: 6, marginTop: 6 }}>
                  <Bar value={p.nafaqa.daily ? p.nafaqa.today_spent / p.nafaqa.daily : 0}
                    color={p.nafaqa.today_left < 0 ? C.red : COLOR.nafaqa} />
                  <View style={s.row}>
                    <T dim size={12}>Sarflandi: {fmt(p.nafaqa.today_spent)}</T>
                    <T dim size={12}>Kunlik: {fmt(p.nafaqa.daily)}</T>
                  </View>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(320)} style={{ flexDirection: 'row', gap: 12 }}>
              <Card style={{ flex: 1, gap: 4 }}>
                <T size={13} bold color={COLOR.nafs}>Nafs</T>
                <T size={20} bold color={p.nafs.week_left < 0 ? C.red : C.text}>{fmt(p.nafs.week_left)}</T>
                <T dim size={12}>{p.nafs.week}-hafta qoldi</T>
                <Bar value={p.nafs.week_limit ? p.nafs.week_spent / p.nafs.week_limit : 0} color={COLOR.nafs} />
              </Card>
              <Card style={{ flex: 1, gap: 4 }}>
                <T size={13} bold color={COLOR.maqsad}>Maqsad</T>
                <T size={20} bold>{fmt(sum.maqsad)}</T>
                <T dim size={12}>rivojlanish uchun</T>
                <Bar value={1} color={COLOR.maqsad} />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(320)}>
              <Pressable onPress={() => router.push('/bayt/qora')} style={({ pressed }) => pressed && { opacity: 0.75 }}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={s.icon}><Text style={{ color: COLOR.qora, fontSize: 18 }}>⛨</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={s.row}>
                      <T size={14} bold>Qora kun</T>
                      <T size={14} bold>{fmt(sum.qora)}</T>
                    </View>
                    {sum.qora_due > 0
                      ? <T size={12} color={COLOR.nafs}>Kartaga o'tkazish kerak: {fmt(sum.qora_due)}</T>
                      : <T dim size={12}>Maqsad: 2 oylik Nafaqa</T>}
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          </>
        ) : null}

        {sum && sum.pending > 0 ? (
          <Animated.View entering={FadeInDown.delay(220).duration(320)}>
            <Pressable onPress={() => router.push('/bayt/taqsimot')} style={({ pressed }) => [s.pending, pressed && { opacity: 0.75 }]}>
              <View style={s.badge}><Text style={s.badgeText}>{sum.pending}</Text></View>
              <T size={14} style={{ flex: 1 }}>Taqsimot — saralash kutmoqda</T>
              <T dim size={18}>›</T>
            </Pressable>
          </Animated.View>
        ) : null}

        {devon.length ? (
          <View style={{ gap: 2, marginTop: 6 }}>
            <Text style={s.h2}>Devon</Text>
            {devon.map((t) => <Row key={t.id} t={t} onLong={() => remove(t)} />)}
            <T dim size={11}>Xato yozuvni o'chirish uchun uzoq bosing</T>
          </View>
        ) : null}
        <View style={{ height: 64 }} />
      </Screen>

      {p ? (
        <Pressable onPress={() => router.push('/bayt/xarajat')} accessibilityLabel="Xarajat qo'shish"
          style={({ pressed }) => [s.fab, { bottom: insets.bottom + 56 + 18 }, pressed && { transform: [{ scale: 0.97 }] }]}>
          <Text style={s.fabText}>＋ Xarajat</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({ t, onLong }: { t: Tx; onLong: () => void }) {
  const inc = t.kind === 'income';
  const tr = t.kind === 'transfer';
  const title = t.pending ? (t.place || 'Yozuv') : tr ? `${walletShort(t.wallet)} → ${walletShort(t.to_wallet ?? '')}`
    : inc ? (t.place || 'Kirim') : (t.category || t.place || 'Xarajat');
  const sub = `${t.ts.slice(11, 16)} · ${t.pending ? 'Taqsimotda' : tr ? "O'tkazma" : inc ? 'Kirim' : LABEL[t.status ?? 'nafaqa']}`;
  return (
    <Pressable onLongPress={onLong} delayLongPress={400} style={({ pressed }) => [s.tx, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={14} lines={1}>{title}</T>
        <T dim size={12}>{sub}</T>
      </View>
      <T size={14} bold color={inc ? COLOR.kirim : tr ? C.dim : C.text}>{inc ? '+' : tr ? '' : '−'}{fmt(t.amount)}</T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { color: C.gold, fontFamily: FONT_INSCR, fontSize: 32 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.subtle2, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center' },
  balance: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  vline: { width: 1, backgroundColor: C.subtle2 },
  hero: { alignItems: 'center', paddingVertical: 22, gap: 6, borderColor: C.goldSoft },
  kicker: { fontSize: 12, letterSpacing: 1.5, fontFamily: FONT_UI.sb },
  big: { color: C.text, fontSize: 48, fontFamily: FONT_UI.b, letterSpacing: -1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.goldSoft },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: C.bg, fontSize: 13, fontFamily: FONT_UI.b },
  h2: { color: C.text, fontFamily: FONT_INSCR, fontSize: 22, marginBottom: 4 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.subtle },
  cta: { marginTop: 6, paddingHorizontal: 22, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: C.bg, fontSize: 15, fontFamily: FONT_UI.b },
  fab: { position: 'absolute', right: 20, height: 56, paddingHorizontal: 22, borderRadius: 28, backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  fabText: { color: C.bg, fontSize: 15, fontFamily: FONT_UI.b },
});
