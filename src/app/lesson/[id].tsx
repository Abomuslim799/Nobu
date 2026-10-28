/**
 * lesson/[id].tsx — interaktiv dars: qadamlar birma-bir ko'rsatiladi.
 *
 * [id] — fayl nomidagi kvadrat qavs "dinamik yo'l" degani: /lesson/py-regex
 * ochilganda id = "py-regex". useLocalSearchParams() shuni o'qiydi.
 *
 * Qadam turlari (data/types.ts):
 *   text — o'qish;  code — loyihadagi haqiqiy kod + tushuntirish;
 *   quiz — variant tanlash;  fill — bo'sh joyni yozib to'ldirish.
 * Test va to'ldirishda javob tekshirilmaguncha "Davom" bosilmaydi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { findLesson } from '@/data/tracks';
import type { Step } from '@/data/types';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, T } from '@/ui/kit';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findLesson(id);
  const { completeLesson } = useProgress();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [answered, setAnswered] = useState<boolean | null>(null);   // null — hali javob yo'q
  const [finished, setFinished] = useState(false);

  if (!found) {
    return <Shell onClose={() => router.back()}><T>Dars topilmadi.</T></Shell>;
  }
  const { track, lesson } = found;
  const step = lesson.steps[index];
  const needsAnswer = step.type === 'quiz' || step.type === 'fill';

  const onAnswer = (ok: boolean) => {
    setAnswered(ok);
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    if (index + 1 < lesson.steps.length) {
      setIndex(index + 1);
      setAnswered(null);
      return;
    }
    completeLesson(lesson.id, score.correct, score.total);
    setFinished(true);
  };

  if (finished) {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 100;
    return (
      <Shell onClose={() => router.back()}>
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 56 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '⚔️' : '🌱'}</Text>
          <T size={22} bold>Dars tugadi</T>
          <T dim>{score.correct}/{score.total} to'g'ri · {pct}%</T>
        </Card>
        <Button label="Davom etish" onPress={() => router.back()} />
      </Shell>
    );
  }

  return (
    <Shell onClose={() => router.back()} header={`${track.icon} ${lesson.title}`}
      progress={(index + (answered !== null || !needsAnswer ? 1 : 0)) / lesson.steps.length}>
      <StepView key={index} step={step} answered={answered} onAnswer={onAnswer} />
      <Button label={index + 1 < lesson.steps.length ? 'Davom' : 'Tugatish'} onPress={next}
        disabled={needsAnswer && answered === null} />
    </Shell>
  );
}

// ── Qadam turlari ───────────────────────────────────────────────────────────
function StepView({ step, answered, onAnswer }: {
  step: Step; answered: boolean | null; onAnswer: (ok: boolean) => void;
}) {
  switch (step.type) {
    case 'text':
      return <Card><Rich text={step.body} /></Card>;

    case 'code':
      return (
        <Card>
          <View style={s.fileTag}>
            <T size={12} color={C.green}>{step.project} · {step.file}</T>
          </View>
          <ScrollView horizontal style={s.code}>
            <Text style={s.codeText}>{step.code}</Text>
          </ScrollView>
          <T>{step.explain}</T>
        </Card>
      );

    case 'quiz':
      return <Quiz step={step} answered={answered} onAnswer={onAnswer} />;

    case 'fill':
      return <Fill step={step} answered={answered} onAnswer={onAnswer} />;
  }
}

function Quiz({ step, answered, onAnswer }: {
  step: Extract<Step, { type: 'quiz' }>; answered: boolean | null; onAnswer: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <Card>
      <T size={17} bold>{step.question}</T>
      {step.options.map((option, i) => {
        const isRight = i === step.answer;
        const show = picked !== null;
        return (
          <Pressable key={i} disabled={show}
            onPress={() => { setPicked(i); onAnswer(isRight); }}
            style={[s.option,
              show && isRight && { borderColor: C.green, backgroundColor: C.greenSoft },
              show && i === picked && !isRight && { borderColor: C.red, backgroundColor: C.redSoft }]}>
            <Text style={s.optionText}>{option}</Text>
          </Pressable>
        );
      })}
      {answered !== null && <Verdict ok={answered} text={step.why} />}
    </Card>
  );
}

function Fill({ step, answered, onAnswer }: {
  step: Extract<Step, { type: 'fill' }>; answered: boolean | null; onAnswer: (ok: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [showHint, setShowHint] = useState(false);
  // Bo'sh joylar va katta-kichik harf farqsiz solishtiramiz.
  const check = () => onAnswer(value.trim().toLowerCase() === step.answer.trim().toLowerCase());
  return (
    <Card>
      <T size={17} bold>{step.prompt}</T>
      <View style={s.code}><Text style={s.codeText}>{step.code}</Text></View>
      <TextInput value={value} onChangeText={setValue} editable={answered === null}
        autoCapitalize="none" autoCorrect={false} placeholder="javob…" placeholderTextColor={C.dim}
        onSubmitEditing={check} style={s.input} />
      {answered === null ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button label="Tekshirish" onPress={check} disabled={!value.trim()} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" label="Yordam" onPress={() => setShowHint(true)} /></View>
        </View>
      ) : (
        <Verdict ok={answered} text={answered ? step.hint : `To'g'ri javob: ${step.answer}. ${step.hint}`} />
      )}
      {showHint && answered === null ? <T dim>💡 {step.hint}</T> : null}
    </Card>
  );
}

function Verdict({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={[s.verdict, { backgroundColor: ok ? C.greenSoft : C.redSoft }]}>
      <T bold color={ok ? C.green : C.red}>{ok ? "To'g'ri!" : "Xato"}</T>
      <T>{text}</T>
    </View>
  );
}

/** **qalin** belgilashni qo'llab-quvvatlaydigan oddiy matn. */
function Rich({ text }: { text: string }) {
  return (
    <Text style={{ color: C.text, fontSize: 16, lineHeight: 24 }}>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**')
          ? <Text key={i} style={{ fontWeight: '700', color: C.green }}>{part.slice(2, -2)}</Text>
          : part)}
    </Text>
  );
}

function Shell({ children, onClose, header, progress }: {
  children: React.ReactNode; onClose: () => void; header?: string; progress?: number;
}) {
  // fullScreenModal'da SafeAreaView iOS'da ba'zan 0 qaytaradi — insetlarni qo'lda beramiz.
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={s.top}>
        <Pressable onPress={onClose} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}>{progress !== undefined ? <Bar value={progress} /> : null}</View>
      </View>
      <ScrollView contentContainerStyle={{ padding: PAD, gap: 12, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled">
        {header ? <T size={20} bold>{header}</T> : null}
        {children}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  fileTag: { alignSelf: 'flex-start', backgroundColor: C.greenSoft, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3 },
  code: { backgroundColor: C.codeBg, borderRadius: 10, padding: 12 },
  codeText: { color: '#D1E7DD', fontFamily: 'Menlo', fontSize: 13, lineHeight: 19 },
  option: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: R - 4, padding: 14 },
  optionText: { color: C.text, fontSize: 15 },
  input: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 12, padding: 12,
    color: C.text, fontSize: 16, fontFamily: 'Menlo' },
  verdict: { borderRadius: 12, padding: 12, gap: 4 },
});
