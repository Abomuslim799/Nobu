/**
 * open-tab.tsx — 📖 Debyut: darslar ro'yxati. Sizning chess.com o'yinlaringizda ko'p uchraydiganlari yuqorida,
 * nazariyadan necha marta chiqqaningiz va takrorlash vaqti kelgani ko'rsatiladi.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { loadCom } from '@/features/chess/chesscom';
import { isDue, loadBoxes, repertoire, type Box } from '@/features/chess/lessons';

export function OpenTab() {
  const [rep, setRep] = useState<ReturnType<typeof repertoire> | null>(null);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  useFocusEffect(useCallback(() => { loadCom().then((c) => setRep(repertoire(c.games))); loadBoxes().then(setBoxes); }, []));
  if (!rep) return null;
  const due = rep.filter((r) => isDue(boxes[r.lesson.id]));
  return (
    <View style={{ gap: 10 }}>
      <T dim size={13}>Har darsda: variant va g'oyalar → yoddan mashq → o'yinlaringizda qayerda chiqib ketgansiz. Toza o'tilgan dars 1, 3, 7, 14, 30 kundan keyin qayta so'raladi.</T>
      {due.length > 0 && <T bold color={C.gold}>🔁 Takrorlash vaqti: {due.map((r) => r.lesson.name).join(', ')}</T>}
      {(['w', 'b'] as const).map((col) => (
        <View key={col} style={{ gap: 8 }}>
          <T bold size={15}>{col === 'w' ? '⚪ Oqlar bilan' : '⚫ Qoralar bilan'}</T>
          {rep.filter((r) => r.lesson.color === col).map((r) => {
            const b = boxes[r.lesson.id];
            return (
              <Pressable key={r.lesson.id} onPress={() => router.push({ pathname: '/chess/opening', params: { id: r.lesson.id } })}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 12, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: isDue(b) ? C.gold : C.cardBorder, gap: 3 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <T bold size={15} style={{ flex: 1 }}>{r.lesson.name}</T>
                  <T size={12} color={b ? C.gold : C.dim}>{b ? '●'.repeat(b.box) + '○'.repeat(5 - b.box) : 'yangi'}</T>
                </View>
                <T dim size={12}>{r.games ? `O'yinlaringizda ${r.games} marta${r.devs.length ? ` · ${r.devs.length} tasida nazariyadan chiqqansiz` : ''}` : r.lesson.lines.map((l) => l.name).join(' · ')}</T>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
