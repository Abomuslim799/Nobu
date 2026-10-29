/**
 * cards.tsx — inglizcha so'z kartochkalari (Leitner usuli).
 *
 * Kartani bosing → aylanadi (orqasida tarjima va misol).
 * "Bildim" → so'z keyingi qutiga o'tadi va keyinroq qaytadi (1 kun, 3 kun, 1 hafta...).
 * "Bilmadim" → 10 daqiqadan keyin yana chiqadi.
 * Pastda — o'z so'zingizni qo'shish.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { DECKS, ALL_WORDS } from '@/data/vocab';
import type { Word } from '@/data/words';
import { useProgress } from '@/lib/progress';
import { hasUzbekAudio, say, stopSpeaking } from '@/lib/speak';
import { Bar, Button, Card, T } from '@/ui/kit';
import { RateSwitch, SoundButton } from '@/ui/sound';
import { Stress } from '@/ui/stress';

const SESSION = 20;   // bir o'tirishda nechta karta

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { data, reviewCard, addWord, removeWord } = useProgress();
  // ?deck=fg1 — faqat shu to'plam (masalan unit so'zlari) va muddatidan qat'i nazar hammasi.
  const { deck } = useLocalSearchParams<{ deck?: string }>();

  // Barcha so'zlar = tayyor ro'yxat + o'zingiznikilar.
  const all: Word[] = useMemo(
    () => [...ALL_WORDS, ...data.myWords.map((w) => ({ ...w, deck: 'my' }))],
    [data.myWords],
  );

  // Navbat sessiya boshida BIR MARTA tuziladi (aks holda har javobdan keyin qayta tartiblanadi).
  const pool = useMemo(() => (deck ? all.filter((w) => w.deck === deck) : all), [all, deck]);
  const build = () => (deck ? [...pool].sort(() => Math.random() - 0.5) : buildQueue(pool, data.cards));
  const [queue, setQueue] = useState<Word[]>(build);
  const [pos, setPos] = useState(0);
  const [stats, setStats] = useState({ knew: 0, missed: 0 });
  const [adding, setAdding] = useState(false);

  const dueCount = deck ? pool.length : buildQueue(pool, data.cards, 999).length;
  const learned = pool.filter((w) => (data.cards[w.id]?.box ?? 0) >= 3).length;
  const card = queue[pos];

  const answer = (knew: boolean) => {
    reviewCard(card.id, knew);
    setStats((st) => (knew ? { ...st, knew: st.knew + 1 } : { ...st, missed: st.missed + 1 }));
    setPos((p) => p + 1);
  };

  const restart = () => {
    setQueue(build());
    setPos(0);
    setStats({ knew: 0, missed: 0 });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}><Bar value={queue.length ? pos / queue.length : 1} /></View>
        <T dim>{Math.min(pos + 1, queue.length)}/{queue.length}</T>
        <RateSwitch />
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
            <T dim>O'rganilgan: {learned}/{pool.length} · Navbatda: {dueCount}</T>
            {dueCount > 0 && <Button label="Yana" onPress={restart} />}
          </Card>
        )}

        <Card style={{ gap: 10 }}>
          <T bold>🧪 Test — 3 bosqich</T>
          <T dim>Tarjima ↔ so'z · ovoz → so'z · gapdagi bo'sh joy</T>
          <View style={s.wrap}>
            {Object.keys(DECKS)
              .filter((d) => all.filter((w) => w.deck === d).length >= 4)
              .map((d) => (
                <Pressable key={d} style={s.chip} onPress={() => router.push(`/quiz?deck=${d}`)}>
                  <T bold color={C.green}>{DECKS[d]}</T>
                </Pressable>
              ))}
          </View>
        </Card>

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

  // Karta chiqqanda so'z o'zi o'qiladi; ekrandan chiqsa — ovoz to'xtaydi.
  useEffect(() => {
    say(word.id, 'w', word.word);
    return stopSpeaking;
  }, [word.id, word.word]);

  const flip = () => {
    Animated.spring(turn, { toValue: back ? 0 : 1, useNativeDriver: true, friction: 7 }).start();
    setBack(!back);
  };
  const front = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rear = turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={flip}>
      {/* pointerEvents — faqat ko'rinib turgan tomon bosilsin (avval orqa tomon old tomonni "to'sib" turardi). */}
      <Animated.View pointerEvents={back ? 'none' : 'auto'}
        style={[s.face, { transform: [{ perspective: 1000 }, { rotateY: front }] }]}>
        {word.image ? <Image source={{ uri: word.image }} style={s.photo} contentFit="cover" />
          : word.emoji ? <Text style={s.emoji}>{word.emoji}</Text> : null}
        <Text style={s.word} adjustsFontSizeToFit numberOfLines={2}>{word.word}</Text>
        {word.ipa ? <Stress ipa={word.ipa} /> : null}
        <Sounds word={word} />
        <T dim>kartani bosing — tarjimasi</T>
      </Animated.View>
      <Animated.View pointerEvents={back ? 'auto' : 'none'}
        style={[s.face, s.faceBack, { transform: [{ perspective: 1000 }, { rotateY: rear }] }]}>
        <Text style={s.translation}>{word.translation}</Text>
        {word.example ? <T style={{ textAlign: 'center', fontStyle: 'italic' }}>“{word.example}”</T> : null}
        {word.note ? <T dim style={{ textAlign: 'center' }}>💡 {word.note}</T> : null}
        <Sounds word={word} uz />
      </Animated.View>
    </Pressable>
  );
}

function Sounds({ word, uz }: { word: Word; uz?: boolean }) {
  return (
    <View style={s.wrap}>
      <SoundButton id={word.id} part="w" text={word.word} label="So'z" />
      {word.example ? <SoundButton id={word.id} part="s" text={word.example} label="Gap" /> : null}
      {uz && hasUzbekAudio(word.id) ? <SoundButton id={word.id} part="uz" text={word.translation} label="O'zbekcha" /> : null}
    </View>
  );
}

function AddWordForm({ onSave, onCancel }: {
  onSave: (w: { word: string; translation: string; example: string; image?: string }) => void; onCancel: () => void;
}) {
  const [image, setImage] = useState<string | undefined>();
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
      {image ? (
        <Pressable onPress={() => setImage(undefined)}>
          <Image source={{ uri: image }} style={s.photo} contentFit="cover" />
          <T dim style={{ textAlign: 'center' }}>bosing — suratni olib tashlash</T>
        </Pressable>
      ) : (
        <View style={s.row}>
          <View style={{ flex: 1 }}><Button kind="ghost" label="🖼 Galereya" onPress={() => pickPhoto(false).then(setImage)} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="📷 Kamera" onPress={() => pickPhoto(true).then(setImage)} /></View>
        </View>
      )}
      <View style={s.row}>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Bekor" onPress={onCancel} /></View>
        <View style={{ flex: 1 }}>
          <Button label="Saqlash" onPress={() => ok && onSave({
            word: word.trim(), translation: translation.trim(), example: example.trim(), image })} />
        </View>
      </View>
    </Card>
  );
}

/**
 * Surat tanlash. Tanlangan rasm vaqtinchalik papkada bo'ladi (iOS uni tozalab yuborishi mumkin),
 * shuning uchun ilovaning doimiy papkasiga nusxalaymiz.
 */
async function pickPhoto(camera: boolean): Promise<string | undefined> {
  const perm = camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Ruxsat yo\'q', 'Sozlamalar → Expo Go dan ruxsat bering.');
    return undefined;
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5 };
  const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled) return undefined;
  try {
    const src = new File(res.assets[0].uri);
    const dest = new File(Paths.document, `word-${Date.now()}.jpg`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return res.assets[0].uri;   // nusxa bo'lmasa — hech bo'lmasa vaqtinchalik manzil
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  face: {
    minHeight: 340, borderRadius: R + 4, padding: 24, gap: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, backfaceVisibility: 'hidden',
  },
  faceBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderColor: C.green },
  word: { color: C.text, fontSize: 38, fontWeight: '800', textAlign: 'center' },
  translation: { color: C.green, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  emoji: { fontSize: 64 },
  photo: { width: '100%', height: 150, borderRadius: R },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.greenSoft },
  myRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    color: C.text, fontSize: 16, padding: 12, borderRadius: 12,
    backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder,
  },
});
