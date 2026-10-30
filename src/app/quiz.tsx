/**
 * quiz.tsx — bitta blok (to'plam) bo'yicha so'z testi, 3 bosqich (lib/quiz.ts).
 * Xato topilgan so'z kartochkalarda tezroq takrorga qaytadi (reviewCard → 1-quti).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { DECKS, ALL_WORDS } from '@/data/vocab';
import type { Word } from '@/data/words';
import { useProgress } from '@/lib/progress';
import { buildQuiz, STAGES, type Question } from '@/lib/quiz';
import { hasUzbekAudio, say, stopSpeaking } from '@/lib/speak';
import { Bar, Button, Card, T } from '@/ui/kit';
import { logSkill } from '@/lib/skills';
import { RateSwitch, SoundButton } from '@/ui/sound';

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const { deck = 'work' } = useLocalSearchParams<{ deck: string }>();
  const { data, reviewCard, recordGame } = useProgress();

  const all: Word[] = useMemo(
    () => [...ALL_WORDS, ...data.myWords.map((w) => ({ ...w, deck: 'my' }))],
    [data.myWords],
  );
  const make = () => buildQuiz(all.filter((w) => w.deck === deck), all, data.cards, hasUzbekAudio);
  const [questions, setQuestions] = useState<Question[]>(make);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const saved = useRef(false);

  const q = questions[idx];
  const done = idx >= questions.length;

  // Ovozli savol chiqqanda — o'zi o'qiladi.
  useEffect(() => {
    if (q?.kind === 'audioEn') say(q.word.id, 'w', q.word.word);
    if (q?.kind === 'audioUz') say(q.word.id, 'uz', q.word.translation);
    return stopSpeaking;
  }, [q]);

  useEffect(() => {
    if (done && !saved.current && questions.length) {
      saved.current = true;
      recordGame(`quiz-${deck}`, score);
      logSkill('vocab', (score / questions.length) * 100, DECKS[deck] ?? deck, missed);
    }
  }, [done, deck, score, questions.length, recordGame, missed]);

  const choose = (option: string) => {
    const q = questions[idx];               // render paytida emas, bosilganda (oxirida q = undefined bo'ladi)
    if (picked || !q) return;
    setPicked(option);
    const ok = option === q.answer;
    if (ok) setScore((sc) => sc + 1);
    else {
      reviewCard(q.word.id, false);
      setMissed((m) => (m.includes(q.word.word) ? m : [...m, q.word.word]));
    }
    say(q.word.id, 'w', q.word.word);      // javobdan keyin to'g'ri talaffuzni eshiting
  };

  const next = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setQuestions(make());
    setIdx(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    saved.current = false;
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}><Bar value={questions.length ? idx / questions.length : 1} /></View>
        <RateSwitch />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {done ? (
          <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
            <Text style={{ fontSize: 52 }}>{score === questions.length ? '🏆' : '🧪'}</Text>
            <T size={26} bold>{score}/{questions.length}</T>
            <T dim>{DECKS[deck]}</T>
            {missed.length > 0 && (
              <T dim style={{ textAlign: 'center' }}>Takrorlash kerak: {missed.join(', ')}</T>
            )}
            <Button label="Yana bir bor" onPress={restart} />
            {missed.length > 0 && <Button kind="ghost" label="🎴 Kartochkada takrorlash" onPress={() => router.replace('/cards')} />}
            <Button kind="ghost" label="Tugatish" onPress={() => router.back()} />
          </Card>
        ) : (
          <>
            <T dim>{q.stage}-bosqich · {STAGES[q.stage]}</T>
            <Prompt q={q} />
            <View style={{ gap: 10 }}>
              {q.options.map((o) => {
                const right = picked && o === q.answer;
                const wrong = picked === o && o !== q.answer;
                return (
                  <Pressable key={o} onPress={() => choose(o)}
                    style={[s.option, right && s.right, wrong && s.wrong]}>
                    <Text style={s.optionText}>{o}</Text>
                  </Pressable>
                );
              })}
            </View>
            {picked && (
              <>
                <T dim style={{ textAlign: 'center' }}>
                  {q.word.word} — {q.word.translation}
                </T>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  <SoundButton id={q.word.id} part="w" text={q.word.word} label="So'z" />
                  {!!q.word.example && <SoundButton id={q.word.id} part="s" text={q.word.example} label="Gap" />}
                </View>
                <Button label="Davom" onPress={next} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Prompt({ q }: { q: Question }) {
  const w = q.word;
  if (q.kind === 'audioEn' || q.kind === 'audioUz') {
    const part = q.kind === 'audioEn' ? 'w' : 'uz';
    return (
      <Card style={s.prompt}>
        <T dim>{q.kind === 'audioEn' ? 'Inglizcha eshiting — qaysi so\'z?' : 'O\'zbekcha eshiting — inglizchasi qaysi?'}</T>
        <Pressable onPress={() => say(w.id, part, part === 'w' ? w.word : w.translation)}
          style={({ pressed }) => [s.play, pressed && { opacity: 0.6 }]}>
          <Text style={{ fontSize: 44 }}>🔊</Text>
        </Pressable>
      </Card>
    );
  }
  if (q.kind === 'cloze') {
    return (
      <Card style={s.prompt}>
        <T dim>Bo'sh joyga qaysi so'z tushadi?</T>
        <Text style={s.sentence}>{q.gapped}</Text>
        <T dim>({w.translation})</T>
      </Card>
    );
  }
  return (
    <Card style={s.prompt}>
      <T dim>{q.kind === 'uz2en' ? 'Inglizchasi qaysi?' : 'Tarjimasi qaysi?'}</T>
      {w.emoji ? <Text style={{ fontSize: 44 }}>{w.emoji}</Text> : null}
      <Text style={s.big}>{q.kind === 'uz2en' ? w.translation : w.word}</Text>
      {q.kind === 'en2uz' && <SoundButton id={w.id} part="w" text={w.word} label="Eshitish" />}
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 14, paddingBottom: 40 },
  prompt: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  big: { color: C.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sentence: { color: C.text, fontSize: 21, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
  play: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenSoft },
  option: { padding: 16, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  right: { backgroundColor: C.greenSoft, borderColor: C.green },
  wrong: { backgroundColor: C.redSoft, borderColor: C.red },
  optionText: { color: C.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
