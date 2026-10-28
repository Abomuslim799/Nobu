/**
 * cards.tsx — inglizcha so'z kartochkalari (Leitner usuli).
 *
 * Kartani bosing → aylanadi (orqasida tarjima va misol).
 * "Bildim" → so'z keyingi qutiga o'tadi va keyinroq qaytadi (1 kun, 3 kun, 1 hafta...).
 * "Bilmadim" → 10 daqiqadan keyin yana chiqadi.
 * Pastda — o'z so'zingizni qo'shish.
 */

import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { DECKS, WORDS, type Word } from '@/data/words';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, T } from '@/ui/kit';

const SESSION = 20;   // bir o'tirishda nechta karta

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { data, reviewCard, addWord, removeWord } = useProgress();

  // Barcha so'zlar = tayyor ro'yxat + o'zingiznikilar.
  const all: Word[] = useMemo(
    () => [...WORDS, ...data.myWords.map((w) => ({ ...w, deck: 'my' as const }))],
    [data.myWords],
  );

  // Navbat sessiya boshida BIR MARTA tuziladi (aks holda har javobdan keyin qayta tartiblanadi).
  const [queue, setQueue] = useState<Word[]>(() => buildQueue(all, data.cards));
  const [pos, setPos] = useState(0);
  const [stats, setStats] = useState({ knew: 0, missed: 0 });
  const [adding, setAdding] = useState(false);

  const dueCount = buildQueue(all, data.cards, 999).length;
  const learned = all.filter((w) => (data.cards[w.id]?.box ?? 0) >= 3).length;
  const card = queue[pos];

  const answer = (knew: boolean) => {
    reviewCard(card.id, knew);
    setStats((st) => (knew ? { ...st, knew: st.knew + 1 } : { ...st, missed: st.missed + 1 }));
    setPos((p) => p + 1);
  };

  const restart = () => {
    setQueue(buildQueue(all, data.cards));
    setPos(0);
    setStats({ knew: 0, missed: 0 });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}><Bar value={queue.length ? pos / queue.length : 1} /></View>
        <T dim>{Math.min(pos + 1, queue.length)}/{queue.length}</T>
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {card ? (
          <>
            <T dim>{DECKS[card.deck]} · quti {(data.cards[card.id]?.box ?? 0) + 1}/5</T>
            {/* key — yangi kartada aylanish holati noldan boshlansin */}
            <FlipCard key={`${card.id}-${pos}`} word={card} />
            <View style={s.row}>
              <View style={{ flex: 1 }}><Button kind="ghost" label="✗ Bilmadim" onPress={() => answer(false)} /></View>
              <View style={{ flex: 1 }}><Button label="✓ Bildim" onPress={() => answer(true)} /></View>
            </View>
          </>
        ) : (
          <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
            <Text style={{ fontSize: 48 }}>{queue.length ? '🎴' : '✅'}</Text>
            <T size={22} bold>{queue.length ? 'Sessiya tugadi' : 'Hozircha takror yo\'q'}</T>
            {queue.length > 0 && <T dim>Bildim: {stats.knew} · Bilmadim: {stats.missed}</T>}
            <T dim>O'rganilgan: {learned}/{all.length} · Navbatda: {dueCount}</T>
            {dueCount > 0 && <Button label="Yana" onPress={restart} />}
          </Card>
        )}

        {adding ? (
          <AddWordForm onSave={(w) => { addWord(w); setAdding(false); }} onCancel={() => setAdding(false)} />
        ) : (
          <Button kind="ghost" label="＋ O'z so'zimni qo'shish" onPress={() => setAdding(true)} />
        )}

        {data.myWords.length > 0 && (
          <Card style={{ gap: 6 }}>
            <T bold>{DECKS.my} ({data.myWords.length})</T>
            {data.myWords.map((w) => (
              <View key={w.id} style={s.myRow}>
                <T style={{ flex: 1 }}>{w.word} — <T dim>{w.translation}</T></T>
                <Pressable onPress={() => removeWord(w.id)} hitSlop={10}><T dim>🗑</T></Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** Muddati kelgan yoki hali ko'rilmagan so'zlar. Avval eski takrorlar, keyin yangilar. */
function buildQueue(all: Word[], cards: Record<string, { box: number; due: number }>, limit = SESSION): Word[] {
  const now = Date.now();
  const due = all.filter((w) => cards[w.id] && cards[w.id].due <= now)
    .sort((a, b) => cards[a.id].due - cards[b.id].due);
  const fresh = all.filter((w) => !cards[w.id]);
  return [...due, ...fresh].slice(0, limit);
}

function FlipCard({ word }: { word: Word }) {
  const turn = useRef(new Animated.Value(0)).current;
  const [back, setBack] = useState(false);

  const flip = () => {
    Animated.spring(turn, { toValue: back ? 0 : 1, useNativeDriver: true, friction: 7 }).start();
    setBack(!back);
  };
  const front = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rear = turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={flip}>
      <Animated.View style={[s.face, { transform: [{ perspective: 1000 }, { rotateY: front }] }]}>
        <Text style={s.word} adjustsFontSizeToFit numberOfLines={2}>{word.word}</Text>
        <T dim>bosing — tarjimasi</T>
      </Animated.View>
      <Animated.View style={[s.face, s.faceBack, { transform: [{ perspective: 1000 }, { rotateY: rear }] }]}>
        <Text style={s.translation}>{word.translation}</Text>
        {word.example ? <T style={{ textAlign: 'center', fontStyle: 'italic' }}>“{word.example}”</T> : null}
        {word.note ? <T dim style={{ textAlign: 'center' }}>💡 {word.note}</T> : null}
      </Animated.View>
    </Pressable>
  );
}

function AddWordForm({ onSave, onCancel }: {
  onSave: (w: { word: string; translation: string; example: string }) => void; onCancel: () => void;
}) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const ok = word.trim() && translation.trim();
  return (
    <Card style={{ gap: 10 }}>
      <T bold>Yangi so'z</T>
      <TextInput style={s.input} placeholder="so'z (inglizcha)" placeholderTextColor={C.dim}
        value={word} onChangeText={setWord} autoCapitalize="none" autoCorrect={false} />
      <TextInput style={s.input} placeholder="tarjimasi" placeholderTextColor={C.dim}
        value={translation} onChangeText={setTranslation} />
      <TextInput style={s.input} placeholder="misol gap (ixtiyoriy)" placeholderTextColor={C.dim}
        value={example} onChangeText={setExample} />
      <View style={s.row}>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Bekor" onPress={onCancel} /></View>
        <View style={{ flex: 1 }}>
          <Button label="Saqlash" onPress={() => ok && onSave({
            word: word.trim(), translation: translation.trim(), example: example.trim() })} />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  face: {
    minHeight: 260, borderRadius: R + 4, padding: 24, gap: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, backfaceVisibility: 'hidden',
  },
  faceBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderColor: C.green },
  word: { color: C.text, fontSize: 38, fontWeight: '800', textAlign: 'center' },
  translation: { color: C.green, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  myRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    color: C.text, fontSize: 16, padding: 12, borderRadius: 12,
    backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder,
  },
});
