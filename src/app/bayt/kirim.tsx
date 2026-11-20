/**
 * Yangi kirim: summa → jonli taqsimot (Nafaqa 50 · Nafs 30 · Maqsad 15 · Qora kun 5) → yangi davr / joriy davrga → checkpoint.
 * Haqiqiy taqsimotni server hisoblaydi (qoldiq qo'shiladi, Qora kun to'lgan bo'lsa 20% Maqsadga) — bu yerda ko'rinish.
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { C, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { addIncome, COLOR, dayLabel, fmt, getSummary, walletShort, type Summary } from '@/features/bayt/api';
import { Head, Keypad, Page } from '@/features/bayt/ui';

const PARTS = [
  { k: 'nafaqa', label: 'Nafaqa', pct: 0.5 },
  { k: 'nafs', label: 'Nafs', pct: 0.3 },
  { k: 'maqsad', label: 'Maqsad', pct: 0.15 },
  { k: 'qora', label: 'Qora kun', pct: 0.05 },
] as const;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Checkpoint tanlovlari: keyingi 10-, 11- va 20-sana. */
function checkpoints(): string[] {
  const now = new Date();
  return [10, 11, 20].map((day) => {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return iso(d);
  });
}

export default function Kirim() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [digits, setDigits] = useState('');
  const [wallets, setWallets] = useState<string[]>(['cash']);
  const [w, setW] = useState(0);
  const [mode, setMode] = useState<'new' | 'add'>('new');
  const cps = checkpoints();
  const [cp, setCp] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getSummary().then((s) => {
      setSum(s);
      const list = [...s.wallets.filter((x) => !x.offbudget && x.id !== 'cash').map((x) => x.id), 'cash'];
      setWallets(list);
      if (s.period) setMode('add');
    }).catch((e) => setErr(String(e.message ?? e)));
  }, []);

  const amount = digits ? parseInt(digits, 10) : 0;
  const carry = mode === 'add' && sum?.period ? Math.max(sum.period.nafaqa.left, 0) + Math.max(sum.period.nafs.left, 0) : 0;
  const base = amount + carry;
  const end = mode === 'add' && sum?.period ? sum.period.checkpoint : cps[cp];
  const days = Math.max(Math.round((new Date(end).getTime() - new Date(iso(new Date())).getTime()) / 86400000), 1);
  const ready = amount > 0 && !busy;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      await addIncome({ amount, wallet: wallets[w], mode, checkpoint: mode === 'new' ? cps[cp] : undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      setBusy(false);
    }
  };

  return (
    <Page>
      <Head title="Yangi kirim" close right={
        <Pressable onPress={() => setW((x) => (x + 1) % wallets.length)} style={s.pill}>
          <T size={12} color={C.dim}>{walletShort(wallets[w] ?? 'cash')}</T>
        </Pressable>} />

      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, paddingVertical: 4 }}>
        <Text style={[s.amount, !amount && { color: C.subtle2 }]}>{amount ? fmt(amount) : '0'}</Text>
        <T dim size={15}>so'm</T>
      </View>

      <View style={s.card}>
        <View style={s.bar}>
          {PARTS.map((p) => (
            <Animated.View key={p.k} style={{ flex: amount ? p.pct : 0, backgroundColor: COLOR[p.k] }} />
          ))}
        </View>
        <View style={s.grid}>
          {PARTS.map((p) => (
            <View key={p.k} style={{ width: '48%', gap: 2 }}>
              <T size={12} bold color={COLOR[p.k]}>{p.label} · {Math.round(p.pct * 100)}%</T>
              <T size={16} bold>{amount ? fmt(base * p.pct) : '—'}</T>
            </View>
          ))}
        </View>
        {amount ? (
          <Animated.View entering={FadeIn.duration(250)} style={s.line}>
            <T size={13} color={C.text}>
              Nafaqa kuniga: <T size={13} bold color={COLOR.nafaqa}>{fmt((base * 0.5) / days)}</T> · {days} kunga
              {carry ? ` · qoldiq ${fmt(carry)} qo'shildi` : ''}
            </T>
          </Animated.View>
        ) : null}
      </View>

      <View style={s.seg}>
        {(['new', 'add'] as const).map((m) => (
          <Pressable key={m} disabled={m === 'add' && !sum?.period} onPress={() => setMode(m)}
            style={[s.segBtn, mode === m && { backgroundColor: C.surface2 }, m === 'add' && !sum?.period && { opacity: 0.4 }]}>
            <Text style={[s.segText, mode === m && { color: C.gold, fontFamily: FONT_UI.b }]}>
              {m === 'new' ? 'Yangi davr' : "Joriy davrga qo'shish"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable disabled={mode === 'add'} onPress={() => setCp((x) => (x + 1) % cps.length)} style={s.cp}>
        <T dim size={13}>Checkpoint</T>
        <T size={13} bold>{dayLabel(end)} · {days} kun</T>
      </Pressable>

      {err ? <T size={13} color={C.red}>{err}</T> : null}
      <View style={{ flex: 1 }} />
      <Keypad digits={digits} onChange={setDigits} h={48} />
      <Pressable onPress={save} disabled={!ready} style={[s.save, { backgroundColor: ready ? C.gold : C.card }]}>
        <Text style={[s.saveText, { color: ready ? C.bg : C.dim }]}>{busy ? 'Saqlanmoqda…' : ready ? 'Taqsimlash' : 'Summani kiriting'}</Text>
      </Pressable>
    </Page>
  );
}

const s = StyleSheet.create({
  pill: { minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 22, borderWidth: 1, borderColor: C.subtle2,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  amount: { color: C.text, fontSize: 44, fontFamily: FONT_UI.b, letterSpacing: -1 },
  card: { padding: 14, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.subtle, gap: 12 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, backgroundColor: C.subtle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  line: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.subtle },
  seg: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.subtle },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segText: { color: C.dim, fontSize: 13, fontFamily: FONT_UI.sb },
  cp: { minHeight: 44, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.subtle2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  save: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontFamily: FONT_UI.b },
});
