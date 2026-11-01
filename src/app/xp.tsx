/**
 * xp.tsx — XP (mehnat): jami XP, ishlangan vaqt, haftalik daqiqalar, muz va streakni tiklash; darajalar yo'li.
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { C, FONT_DISPLAY, PAD } from '@/core/theme';
import { useRating } from '@/core/store';
import { fmtDur, lastDays , dayKey } from '@/core/date';
import { MUZ_MAX, PRICE, RANKS } from '@/features/assessment/rating';
import { Card, T } from '@/core/ui/kit';
import { fmtN } from '@/features/assessment/astrolabe';

const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export default function XPScreen() {
  const rating = useRating();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState('');
  const days = lastDays(7);
  const mins = days.map((d) => Math.floor((rating.m.sec[d] ?? 0) / 60));
  const maxM = Math.max(30, ...mins);
  const W = 300, H = 96;
  const frozenDay = days.find((d) => rating.mark(d) === 'frozen');
  const rankIdx = RANKS.findIndex((r) => r.id === rating.rank.id);

  return (
    <View style={[s.root, { paddingTop: insets.top + 4 }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={24}>‹</T></Pressable>
        <Text style={s.h1}>XP va streak</Text>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 30 }]}>
        <Card style={{ alignItems: 'center', gap: 2 }}>
          <T size={36} bold color={C.gold} style={{ fontVariant: ['tabular-nums'] }}>{fmtN(rating.xp)} XP</T>
          <T dim size={13}>Jami ishlangan vaqt: {fmtDur(rating.totalSec)}</T>
          <T dim size={13}>Bugun: {fmtDur(rating.todaySec)} · {rating.todayXP} XP · 🔥 {rating.streak} kun (rekord {rating.best})</T>
        </Card>

        <Card style={{ gap: 6 }}>
          <T bold>Bu hafta (daqiqa)</T>
          <Svg width="100%" height={H + 16} viewBox={`0 0 ${W} ${H + 16}`}>
            {days.map((d, k) => {
              const m = mins[k], h = Math.max(3, (m / maxM) * (H - 14)), x = k * (W / 7) + 8, bw = W / 7 - 16;
              const fr = rating.mark(d) === 'frozen';
              const [y, mo, dd] = d.split('-').map(Number);
              return [
                <Rect key={`b${d}`} x={x} y={H - h} width={bw} height={h} rx={5} fill={fr ? '#7DD3FC' : m >= 5 ? C.green : C.subtle2} opacity={d === dayKey() ? 1 : 0.85} />,
                <SvgText key={`v${d}`} x={x + bw / 2} y={H - h - 4} fontSize={10} fill={C.dim} textAnchor="middle">{fr ? '🧊' : m || ''}</SvgText>,
                <SvgText key={`l${d}`} x={x + bw / 2} y={H + 13} fontSize={10} fill={d === dayKey() ? C.text : C.dim} textAnchor="middle">{WD[new Date(y, mo - 1, dd).getDay()]}</SvgText>,
              ];
            })}
          </Svg>
          {frozenDay && <T dim size={12}>🧊 {frozenDay.slice(5)} — muz ishlatildi, streak saqlandi</T>}
          <T dim size={12}>Streak kuni — kamida 5 daqiqa faol vaqt. XP: 5–19 daq → 1, 20 daq → 2, keyin har 5 daqiqa +1. Ekranga 60 s tegilmasa vaqt hisoblanmaydi.</T>
        </Card>

        <Shop icon="🧊" title="Muz" sub={`Kirmagan kuningiz streakni saqlaydi (avtomatik) · ${rating.m.muz}/${MUZ_MAX} zaxirada`} price={PRICE.muz}
          disabled={rating.m.muz >= MUZ_MAX || rating.xp < PRICE.muz}
          onPress={() => setMsg(rating.buyMuz() ? '🧊 Muz olindi' : rating.m.muz >= MUZ_MAX ? `Ko'pi bilan ${MUZ_MAX} ta` : 'XP yetmaydi')} />
        <Shop icon="🔧" title="Streakni tiklash" sub={rating.canRestore.length ? `Uzilgan ${rating.canRestore.length} kun qaytariladi (48 soat ichida)` : 'Streak uzilmagan — kerak emas'}
          price={PRICE.tiklash} disabled={!rating.canRestore.length || rating.xp < PRICE.tiklash}
          onPress={() => setMsg(rating.restore() ? '🔧 Streak tiklandi' : 'XP yetmaydi')} />
        {!!msg && <T bold color={C.gold} style={{ textAlign: 'center' }}>{msg}</T>}

        <Card style={{ gap: 4 }}>
          <T bold>Streak bonuslari (bir martalik)</T>
          <T dim size={13}>1-kun +5 · 3-kun +10 · 7-kun +15 · keyin har 7 kunda +5 ko'proq · 30-kun yana +20</T>
        </Card>

        <Text style={[s.h1, { fontSize: 22, marginTop: 6 }]}>Darajalar</Text>
        <T dim size={13}>Daraja nomi faqat imtihon bilan o'zgaradi: FR keyingi chegaraga yetsa imtihon ochiladi (o'tish — 85%). Har 3 oyda tasdiq imtihoni.</T>
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {RANKS.map((r, k) => {
            const cur = k === rankIdx, done = k < rankIdx;
            return (
              <View key={r.id} style={[s.rank, k > 0 && { borderTopWidth: 1, borderTopColor: C.cardBorder }]}>
                <View style={[s.dot, { backgroundColor: cur ? C.gold : done ? C.green : C.subtle2 }]} />
                <Text style={[s.rankT, cur && { color: C.gold }]}>{r.title}</Text>
                <T dim size={13} style={{ fontVariant: ['tabular-nums'] }}>{r.min ? `${fmtN(r.min)}+ FR` : `${fmtN(RANKS[1].min)} gacha`}</T>
              </View>
            );
          })}
        </Card>
        <T dim size={12}>XP — mehnat, FR — bilim. FR ni XP bilan sotib olib bo'lmaydi.</T>
      </ScrollView>
    </View>
  );
}

function Shop({ icon, title, sub, price, onPress, disabled }: { icon: string; title: string; sub: string; price: number; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.shop, pressed && { opacity: 0.7 }]}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <View style={{ flex: 1 }}><T bold>{title}</T><T dim size={12}>{sub}</T></View>
      <View style={[s.price, disabled && { opacity: 0.45 }]}><T bold size={13} color={C.gold}>{price} XP</T></View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 6 },
  h1: { color: C.text, fontFamily: FONT_DISPLAY, fontSize: 26 },
  body: { padding: PAD, gap: 12 },
  shop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  price: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.goldSoft },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rankT: { flex: 1, color: C.text, fontFamily: FONT_DISPLAY, fontSize: 16 },
});
