/**
 * Kutubxona — kitoblar (o'qish vaqti + tahlillar) va iqtiboslar.
 * Kitoblar Mutolaa'da o'qiladi; Nobu vaqtni va "nimani tushundim"ni saqlaydi.
 */

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { C, R } from '@/constants/theme';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';
import { QuoteCard } from '@/ui/quote-card';

type Tab = 'books' | 'quotes';

export default function Library() {
  const [tab, setTab] = useState<Tab>('books');
  return (
    <Screen>
      <Title sub="Mutolaa'da o'qing — Nobu vaqtni va fikrlaringizni saqlaydi.">Kutubxona</Title>
      <View style={s.segment}>
        {(['books', 'quotes'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.segBtn, tab === t && s.segOn]}>
            <Text style={[s.segText, tab === t && { color: C.bg }]}>{t === 'books' ? '📚 Kitoblar' : '❝ Iqtiboslar'}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'books' ? <Books /> : <Quotes />}
    </Screen>
  );
}

function Books() {
  const { data, todayRead } = useProgress();
  const goal = data.settings.readGoal;
  const active = data.activeRead && data.books.find((b) => b.id === data.activeRead!.bookId);
  const minutesOf = (id: string) => data.sessions.filter((x) => x.bookId === id).reduce((a, x) => a + x.minutes, 0);

  return (
    <>
      <Card>
        <T bold>Bugun: {todayRead}/{goal} daqiqa</T>
        <Bar value={todayRead / goal} />
        <T dim size={13}>Sessiya 5 daqiqadan oshsa va tahlil yozilsa hisoblanadi.</T>
      </Card>

      {active && (
        <Pressable onPress={() => router.push(`/book/${active.id}`)}>
          <Card style={{ borderColor: C.green }}>
            <T color={C.green} bold>⏱ Hozir o'qilmoqda: {active.title}</T>
            <T dim>Tugatish va tahlil yozish uchun bosing</T>
          </Card>
        </Pressable>
      )}

      <Button label="＋ Kitob qo'shish" onPress={() => router.push('/book/new')} />

      {data.books.length === 0 && <T dim>Hozircha kitob yo'q. Mutolaa'da o'qiyotgan kitobingizni qo'shing.</T>}
      {data.books.map((b) => (
        <Pressable key={b.id} onPress={() => router.push(`/book/${b.id}`)}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <T bold size={17}>{b.finished ? '✅ ' : ''}{b.title}</T>
                <T dim>{b.author}</T>
              </View>
              <T dim>{Math.round(b.progress * 100)}%</T>
            </View>
            <Bar value={b.progress} />
            <T dim size={13}>
              {minutesOf(b.id)} daqiqa · {data.sessions.filter((x) => x.bookId === b.id).length} ta tahlil
            </T>
          </Card>
        </Pressable>
      ))}
    </>
  );
}

function Quotes() {
  const { data, saveQuote } = useProgress();
  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => [...new Set(data.quotes.flatMap((q) => q.tags))].sort(), [data.quotes]);
  const bookTitle = (id?: string) => data.books.find((b) => b.id === id)?.title;
  const list = data.quotes.filter((q) => {
    const hay = `${q.text} ${q.author} ${bookTitle(q.bookId) ?? ''}`.toLowerCase();
    return (!onlyFav || q.fav) && (!tag || q.tags.includes(tag)) && hay.includes(query.toLowerCase());
  });

  return (
    <>
      <Button label="＋ Iqtibos qo'shish" onPress={() => router.push('/quote/new')} />
      <TextInput style={s.search} placeholder="Qidirish: matn, muallif, kitob" placeholderTextColor={C.dim}
        value={query} onChangeText={setQuery} />
      <View style={s.chips}>
        <Chip on={onlyFav} label="★ Sevimli" onPress={() => setOnlyFav(!onlyFav)} />
        {tags.map((t) => <Chip key={t} on={tag === t} label={`#${t}`} onPress={() => setTag(tag === t ? null : t)} />)}
      </View>
      {list.length === 0 && <T dim>{data.quotes.length ? 'Mos iqtibos topilmadi.' : "Hozircha iqtibos yo'q."}</T>}
      {list.map((q) => <QuoteCard key={q.id} q={q} book={bookTitle(q.bookId)}
        onFav={() => saveQuote({ ...q, fav: !q.fav })} />)}
    </>
  );
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.green }]}>
      <Text style={[s.chipText, on && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R, padding: 4, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: R - 4, alignItems: 'center' },
  segOn: { backgroundColor: C.green },
  segText: { color: C.text, fontWeight: '700' },
  search: { color: C.text, padding: 12, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: C.card },
  chipText: { color: C.text, fontSize: 13, fontWeight: '600' },
});
