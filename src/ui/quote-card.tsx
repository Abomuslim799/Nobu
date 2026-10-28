/**
 * quote-card.tsx — iqtibos kartasi (Kutubxona, kitob sahifasi va Bugun ekranida).
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import type { Quote } from '@/lib/progress';
import { Card, T } from '@/ui/kit';

export function QuoteCard({ q, book, onFav }: { q: Quote; book?: string; onFav?: () => void }) {
  return (
    <Pressable onPress={() => router.push(`/quote/${q.id}`)}>
      <Card style={{ gap: 6 }}>
        <Text style={s.quote}>“{q.text}”</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T dim style={{ flex: 1 }}>— {q.author}{book ? `, «${book}»` : ''}</T>
          {onFav && <Pressable onPress={onFav} hitSlop={10}><T size={20} color={q.fav ? C.fire : C.dim}>{q.fav ? '★' : '☆'}</T></Pressable>}
        </View>
        {q.tags.length > 0 && <T dim size={12}>{q.tags.map((t) => `#${t}`).join('  ')}</T>}
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  quote: { color: C.text, fontSize: 17, lineHeight: 25, fontStyle: 'italic' },
});
