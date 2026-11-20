/**
 * Xarajat qo'shish: hamyon → summa → status (Nafaqa/Nafs/Maqsad) → kategoriya → Saqlash.
 * Summa ostida limit jonli ko'rinadi ("26 250 → 6 250 qoladi").
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { C, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { addExpense, CATS, COLOR, fmt, getSummary, LABEL, walletShort, type Summary } from '@/features/bayt/api';
import { Chip, Head, Keypad, Page } from '@/features/bayt/ui';

type St = 'nafaqa' | 'nafs' | 'maqsad';

export default function Xarajat() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [digits, setDigits] = useState('');
  const [wallet, setWallet] = useState('cash');
  const [status, setStatus] = useState<St>('nafaqa');
  const [cat, setCat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getSummary().then((s) => {
      setSum(s);
      const card = s.wallets.find((w) => !w.offbudget && w.id.startsWith('card:'));
      if (card) setWallet(card.id);
    }).catch((e) => setErr(String(e.message ?? e)));
  }, []);

  const amount = digits ? parseInt(digits, 10) : 0;
  const wallets = [...(sum?.wallets.filter((w) => !w.offbudget && w.id !== 'cash').map((w) => w.id) ?? []), 'cash'];
  const p = sum?.period;
  const left = status === 'nafaqa' ? p?.nafaqa.today_left : status === 'nafs' ? p?.nafs.week_left : sum?.maqsad;
  const word = status === 'nafaqa' ? 'Bugungi Nafaqa' : status === 'nafs' ? 'Haftalik Nafs' : 'Maqsad';
  let preview = '';
  let over = false;
  if (left !== undefined) {
    const rest = left - amount;
    over = amount > 0 && rest < 0;
    preview = !amount ? `${word}: ${fmt(left)} qoldi`
      : !over ? `${word}: ${fmt(left)} → ${fmt(rest)} qoladi`
      : `${word} ${fmt(-rest)} so'mga oshadi — qolgan kunlarga yoyiladi`;
  }
  const ready = amount > 0 && !!cat && !busy;

  const save = async () => {
    if (!ready || !cat) return;
    setBusy(true);
    try {
      await addExpense({ amount, status, category: cat, wallet });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      setBusy(false);
    }
  };

  return (
    <Page>
      <Head title="Xarajat" close />
      <View style={s.row}>
        {wallets.map((w) => <Chip key={w} label={walletShort(w)} on={wallet === w} color={COLOR.cash} onPress={() => setWallet(w)} />)}
      </View>

      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={[s.amount, !amount && { color: C.subtle2 }]}>{amount ? fmt(amount) : '0'}</Text>
          <T dim size={15}>so'm</T>
        </View>
        {preview ? <T size={13} color={over ? COLOR.nafs : C.dim}>{preview}</T> : null}
      </View>

      <View style={s.seg}>
        {(['nafaqa', 'nafs', 'maqsad'] as St[]).map((k) => (
          <Pressable key={k} onPress={() => { setStatus(k); setCat(null); }}
            style={[s.segBtn, status === k && { backgroundColor: C.surface2 }]}>
            <Text style={[s.segText, status === k && { color: COLOR[k], fontFamily: FONT_UI.b }]}>{LABEL[k]}</Text>
          </Pressable>
        ))}
      </View>

      <Animated.View key={status} entering={FadeIn.duration(220)} layout={LinearTransition} style={[s.row, { minHeight: 96 }]}>
        {CATS[status].map((c) => <Chip key={c} label={c} on={cat === c} color={COLOR[status]} onPress={() => setCat(c)} />)}
      </Animated.View>

      {err ? <T size={13} color={C.red}>{err}</T> : null}
      <View style={{ flex: 1 }} />
      <Keypad digits={digits} onChange={setDigits} />
      <Pressable onPress={save} disabled={!ready}
        style={[s.save, { backgroundColor: ready ? COLOR[status] : C.card }]}>
        <Text style={[s.saveText, { color: ready ? C.bg : C.dim }]}>
          {busy ? 'Saqlanmoqda…' : ready ? 'Saqlash' : amount ? 'Kategoriyani tanlang' : 'Summani kiriting'}
        </Text>
      </Pressable>
    </Page>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' },
  amount: { color: C.text, fontSize: 46, fontFamily: FONT_UI.b, letterSpacing: -1 },
  seg: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.subtle },
  segBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segText: { color: C.dim, fontSize: 14, fontFamily: FONT_UI.sb },
  save: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontFamily: FONT_UI.b },
});
