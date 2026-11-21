/**
 * Qora kun — zaxira fondi. Fond = Qora kun kartasidagi haqiqiy pul:
 *   boshlang'ich summa (kartada avvaldan turgan) + kartaga o'tkazilgan pul (Taqsimot'da "→ Qora kun").
 * Har kirimdan 5% ajratiladi — u kartaga o'tkazilguncha "o'tkazish kerak" bo'lib turadi (ikki marta qo'shilmaydi).
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, FONT_UI } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { COLOR, fmt, getSummary, setReserve, type Summary } from '@/features/bayt/api';
import { Head, Keypad, Page } from '@/features/bayt/ui';

export default function Qora() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { getSummary().then(setSum).catch((e) => setErr(String(e.message ?? e))); }, []);

  const amount = digits ? parseInt(digits, 10) : 0;
  const ready = !!digits && !busy;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      await setReserve(amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
      setBusy(false);
    }
  };

  return (
    <Page>
      <Head title="Qora kun" />
      <View style={s.card}>
        <View style={s.row}><T dim size={13}>Fondda hozir</T><T size={20} bold>{sum ? fmt(sum.qora) : '—'}</T></View>
        {sum && sum.qora_due > 0
          ? <T size={13} color={COLOR.nafs}>Kartaga o'tkazish kerak: {fmt(sum.qora_due)} — o'tkazgach, bank xabarini botga forward qiling va Taqsimot'da "→ Qora kun" ni tanlang.</T>
          : <T dim size={13}>Har kirimdan 5% ajratiladi. Fond 2 oylik Nafaqaga yetgach, bu 5% Maqsadga qaytadi.</T>}
      </View>

      <T dim size={13}>Kartada avvaldan turgan summa (boshlang'ich)</T>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
        <Text style={[s.amount, !digits && { color: C.subtle2 }]}>{digits ? fmt(amount) : '0'}</Text>
        <T dim size={15}>so'm</T>
      </View>

      {err ? <T size={13} color={C.red}>{err}</T> : null}
      <Keypad digits={digits} onChange={setDigits} />
      <Pressable onPress={save} disabled={!ready} style={[s.save, { backgroundColor: ready ? COLOR.qora : C.card }]}>
        <Text style={[s.saveText, { color: ready ? C.bg : C.dim }]}>{busy ? 'Saqlanmoqda…' : ready ? 'Saqlash' : 'Summani kiriting'}</Text>
      </Pressable>
    </Page>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.subtle, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  amount: { color: C.text, fontSize: 40, fontFamily: FONT_UI.b, letterSpacing: -1 },
  save: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 16, fontFamily: FONT_UI.b },
});
