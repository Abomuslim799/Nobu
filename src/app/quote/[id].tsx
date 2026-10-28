/**
 * quote/[id].tsx — iqtibos qo'shish/tahrirlash. id = "new"; ?book=<id> — kitob oldindan tanlangan.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { useProgress } from '@/lib/progress';
import { Button, T } from '@/ui/kit';

export default function QuoteScreen() {
  const insets = useSafeAreaInsets();
  const { id, book: bookParam } = useLocalSearchParams<{ id: string; book?: string }>();
  const { data, saveQuote, removeQuote } = useProgress();
  const old = data.quotes.find((q) => q.id === id);
  const [text, setText] = useState(old?.text ?? '');
  const [author, setAuthor] = useState(old?.author ?? '');
  const [bookId, setBookId] = useState<string | undefined>(old?.bookId ?? bookParam);
  const [tags, setTags] = useState(old?.tags.join(', ') ?? '');
  const book = data.books.find((b) => b.id === bookId);

  const save = () => {
    if (!text.trim()) return Alert.alert('Iqtibos', 'Matnni kiriting.');
    saveQuote({
      ...old, text: text.trim(), bookId,
      author: author.trim() || book?.author || "Noma'lum",
      tags: tags.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean),
    });
    router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <T bold>{old ? 'Iqtibos' : 'Yangi iqtibos'}</T>
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <TextInput style={[s.input, { minHeight: 120, fontStyle: 'italic' }]} multiline placeholder="Iqtibos matni"
          placeholderTextColor={C.dim} value={text} onChangeText={setText} />
        <TextInput style={s.input} placeholder={book ? `Muallif (${book.author})` : 'Muallif'}
          placeholderTextColor={C.dim} value={author} onChangeText={setAuthor} />
        <TextInput style={s.input} placeholder="Teglar: motivatsiya, ish, falsafa" placeholderTextColor={C.dim}
          value={tags} onChangeText={setTags} autoCapitalize="none" />
        <T dim>Kitob (ixtiyoriy)</T>
        <View style={s.chips}>
          <Chip on={!bookId} label="Kitobsiz" onPress={() => setBookId(undefined)} />
          {data.books.map((b) => <Chip key={b.id} on={bookId === b.id} label={b.title} onPress={() => setBookId(b.id)} />)}
        </View>
        <Button label="Saqlash" onPress={save} />
        {old && (
          <Button kind="ghost" label="O'chirish" onPress={() => { removeQuote(old.id); router.back(); }} />
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.green }]}>
      <Text style={{ color: on ? C.bg : C.text, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: 12, backgroundColor: C.codeBg,
    borderWidth: 1, borderColor: C.cardBorder, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card, maxWidth: '100%' },
});
