/**
 * book/[id].tsx — bitta kitob: o'qish taymeri, "nimani tushundim", shu kitob tahlillari,
 * umumiy xulosa va iqtiboslar. id = "new" — yangi kitob qo'shish.
 *
 * Taymer qanday ishlaydi: boshlanganda vaqt belgisi (start) saqlanadi. Siz Mutolaa'ga
 * o'tib ketasiz, Nobu orqa fonda "uxlaydi" — qaytganingizda o'tgan vaqt start'dan hisoblanadi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { READ_MIN, useProgress, type Book } from '@/lib/progress';
import { clock, openMutolaa } from '@/lib/reading';
import { Bar, Button, Card, T } from '@/ui/kit';
import { QuoteCard } from '@/ui/quote-card';

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useProgress();
  const book = data.books.find((b) => b.id === id);
  const [editing, setEditing] = useState(id === 'new');

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <T bold style={{ flex: 1 }}>{book ? book.title : 'Yangi kitob'}</T>
        {book && !editing && <Pressable onPress={() => setEditing(true)} hitSlop={10}><T color={C.green}>Tahrirlash</T></Pressable>}
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {editing || !book
          ? <BookForm book={book} onDone={(newId) => (book ? setEditing(false) : router.replace(`/book/${newId}`))} />
          : <BookView book={book} />}
      </ScrollView>
    </View>
  );
}

function BookView({ book }: { book: Book }) {
  const { data, startReading, saveBook, removeSession } = useProgress();
  const sessions = data.sessions.filter((x) => x.bookId === book.id);
  const quotes = data.quotes.filter((q) => q.bookId === book.id);
  const total = sessions.reduce((a, x) => a + x.minutes, 0);
  const readingThis = data.activeRead?.bookId === book.id;
  const readingOther = data.activeRead && !readingThis;
  const [summary, setSummary] = useState(book.summary ?? '');
  const [manual, setManual] = useState(false);

  // Tezlik va taxminiy tugash (sahifalar soni ma'lum bo'lsa).
  const pagesRead = book.pages ? Math.round(book.progress * book.pages) : 0;
  const perHour = book.pages && total >= 10 ? Math.round((pagesRead / total) * 60) : 0;
  const daysLeft = perHour && data.settings.readGoal
    ? Math.ceil(((book.pages! - pagesRead) / perHour) * 60 / data.settings.readGoal) : 0;

  const start = () => {
    startReading(book.id);
    openMutolaa();
  };

  return (
    <>
      <Card>
        <T dim>{book.author} · {book.lang.toUpperCase()}{book.pages ? ` · ${book.pages} bet` : ''}</T>
        <Bar value={book.progress} />
        <T dim size={13}>
          {Math.round(book.progress * 100)}% · jami {total} daqiqa
          {perHour ? ` · ~${perHour} bet/soat` : ''}{daysLeft > 0 && !book.finished ? ` · tugashiga ~${daysLeft} kun` : ''}
        </T>
      </Card>

      {readingThis ? (
        <FinishForm book={book} />
      ) : manual ? (
        <FinishForm book={book} manual onCancel={() => setManual(false)} />
      ) : (
        <>
          <Button label="▶ O'qishni boshlash (Mutolaa)" disabled={!!readingOther} onPress={start} />
          {readingOther && <T dim size={13}>Boshqa kitob o'qilmoqda — avval uni tugating.</T>}
          <Button kind="ghost" label="✎ Vaqtni qo'lda kiritish" onPress={() => setManual(true)} />
        </>
      )}

      <Card style={{ gap: 8 }}>
        <T bold>Umumiy xulosa</T>
        <T dim size={13}>Tahlillaringizni o'qib, kitob haqidagi asosiy fikrni yozing. (Keyinroq AI ham yordam beradi.)</T>
        <TextInput style={[s.input, { minHeight: 90 }]} multiline placeholder="Bu kitob menga nimani o'rgatdi..."
          placeholderTextColor={C.dim} value={summary} onChangeText={setSummary}
          onEndEditing={() => summary !== (book.summary ?? '') && saveBook({ ...book, summary })} />
      </Card>

      <T bold size={17}>Tahlillar ({sessions.length})</T>
      {sessions.length === 0 && <T dim>Hali tahlil yo'q.</T>}
      {sessions.map((x) => (
        <Card key={x.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T dim size={13}>{x.day} · {x.minutes} daq{x.upto ? ` · ${x.upto} gacha` : ''}</T>
            <Pressable hitSlop={10} onPress={() => Alert.alert("O'chirish", 'Bu tahlil o\'chirilsinmi?', [
              { text: 'Bekor', style: 'cancel' },
              { text: "O'chirish", style: 'destructive', onPress: () => removeSession(x.id) },
            ])}><T dim>🗑</T></Pressable>
          </View>
          <T>{x.note || <T dim>(tahlil yozilmagan — hisoblanmadi)</T>}</T>
          {x.minutes < READ_MIN && <T dim size={12}>{READ_MIN} daqiqadan kam — kunlik maqsadga qo'shilmadi</T>}
        </Card>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T bold size={17}>Iqtiboslar ({quotes.length})</T>
        <Pressable onPress={() => router.push(`/quote/new?book=${book.id}`)} hitSlop={10}><T color={C.green}>＋ Qo'shish</T></Pressable>
      </View>
      {quotes.map((q) => <QuoteCard key={q.id} q={q} />)}
    </>
  );
}

/** O'qishni tugatish: vaqt (avtomatik yoki qo'lda), tahlil, qayergacha o'qildi. */
function FinishForm({ book, manual, onCancel }: { book: Book; manual?: boolean; onCancel?: () => void }) {
  const { data, finishReading, cancelReading } = useProgress();
  const start = manual ? Date.now() : data.activeRead!.start;
  const [now, setNow] = useState(Date.now());
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');
  const [upto, setUpto] = useState('');

  useEffect(() => {
    if (manual) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [manual]);

  const elapsed = Math.max(0, (now - start) / 1000);
  const mins = Number(minutes) || (manual ? 0 : Math.round(elapsed / 60));
  const counts = mins >= READ_MIN && note.trim().length > 0;

  // "120" → sahifa (kitobda sahifalar soni bo'lsa), "45%" yoki "45" → foiz.
  const parseProgress = (): { progress?: number; label?: string } => {
    const v = upto.trim();
    if (!v) return {};
    const n = parseFloat(v);
    if (Number.isNaN(n)) return { label: v };
    if (v.endsWith('%') || !book.pages) return { progress: Math.min(1, n / 100), label: `${n}%` };
    return { progress: Math.min(1, n / book.pages), label: `${n}-bet` };
  };

  const save = () => {
    if (mins <= 0) return Alert.alert('Vaqt', 'Necha daqiqa o\'qiganingizni kiriting.');
    const p = parseProgress();
    const go = () => {
      finishReading({ bookId: book.id, start: manual ? Date.now() - mins * 60_000 : start,
        minutes: mins, note: note.trim(), upto: p.label, progress: p.progress });
      onCancel?.();
    };
    if (!counts) {
      Alert.alert('Hisoblanmaydi', `Kunlik maqsadga faqat ${READ_MIN}+ daqiqa va tahlil yozilgan sessiya qo'shiladi. Baribir saqlansinmi?`, [
        { text: 'Tahlil yozaman', style: 'cancel' }, { text: 'Saqlash', onPress: go },
      ]);
    } else go();
  };

  return (
    <Card style={{ gap: 10, borderColor: C.green }}>
      {!manual && (
        <>
          <Text style={s.timer}>{clock(elapsed)}</Text>
          <Button kind="ghost" label="📖 Mutolaa'ga qaytish" onPress={openMutolaa} />
        </>
      )}
      <T bold>Nimani tushundim?</T>
      <TextInput style={[s.input, { minHeight: 110 }]} multiline placeholderTextColor={C.dim}
        placeholder="Asosiy g'oya, qahramon nima qildi, menga nima foydali..." value={note} onChangeText={setNote} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput style={[s.input, { flex: 1 }]} keyboardType="numeric" placeholderTextColor={C.dim}
          placeholder={manual ? 'daqiqa' : `${Math.round(elapsed / 60)} daqiqa`} value={minutes} onChangeText={setMinutes} />
        <TextInput style={[s.input, { flex: 1 }]} placeholderTextColor={C.dim}
          placeholder={book.pages ? 'qaysi betgacha' : 'necha % gacha'} value={upto} onChangeText={setUpto} />
      </View>
      <T dim size={12}>{counts ? '✓ Kunlik maqsadga qo\'shiladi' : `${READ_MIN}+ daqiqa va tahlil kerak`}</T>
      <Button label="Saqlash" onPress={save} />
      <Button kind="ghost" label="Bekor qilish" onPress={() => (manual ? onCancel?.() : Alert.alert(
        'Bekor qilish', 'Bu sessiya vaqti saqlanmaydi.', [
          { text: 'Yo\'q', style: 'cancel' }, { text: 'Bekor qilish', style: 'destructive', onPress: cancelReading }]))} />
    </Card>
  );
}

function BookForm({ book, onDone }: { book?: Book; onDone: (id: string) => void }) {
  const { saveBook, removeBook } = useProgress();
  const [title, setTitle] = useState(book?.title ?? '');
  const [author, setAuthor] = useState(book?.author ?? '');
  const [pages, setPages] = useState(book?.pages ? String(book.pages) : '');
  const [lang, setLang] = useState<Book['lang']>(book?.lang ?? 'uz');

  const save = () => {
    if (!title.trim()) return Alert.alert('Kitob nomi', 'Nomini kiriting.');
    const id = saveBook({ ...book, title: title.trim(), author: author.trim() || "Noma'lum",
      pages: Number(pages) || undefined, lang });
    onDone(id);
  };

  return (
    <Card style={{ gap: 10 }}>
      <TextInput style={s.input} placeholder="Kitob nomi" placeholderTextColor={C.dim} value={title} onChangeText={setTitle} />
      <TextInput style={s.input} placeholder="Muallif" placeholderTextColor={C.dim} value={author} onChangeText={setAuthor} />
      <TextInput style={s.input} placeholder="Jami betlar (ixtiyoriy — bo'lmasa % da)" placeholderTextColor={C.dim}
        keyboardType="numeric" value={pages} onChangeText={setPages} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['uz', 'en', 'ru'] as const).map((l) => (
          <Pressable key={l} onPress={() => setLang(l)} style={[s.lang, lang === l && { backgroundColor: C.green }]}>
            <Text style={{ color: lang === l ? C.bg : C.text, fontWeight: '700' }}>{l.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Saqlash" onPress={save} />
      {book && (
        <Button kind="ghost" label="Kitobni o'chirish" onPress={() => Alert.alert(
          "O'chirish", 'Kitob va uning barcha tahlillari o\'chiriladi.', [
            { text: 'Bekor', style: 'cancel' },
            { text: "O'chirish", style: 'destructive', onPress: () => { removeBook(book.id); router.back(); } },
          ])} />
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: 12, backgroundColor: C.codeBg,
    borderWidth: 1, borderColor: C.cardBorder, textAlignVertical: 'top' },
  timer: { color: C.green, fontSize: 48, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  lang: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: C.card },
});
