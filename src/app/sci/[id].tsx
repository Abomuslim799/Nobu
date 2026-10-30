/**
 * sci/[id].tsx — Science darsi. Bloklar ketma-ket ochiladi: taxmin, simulyatsiya, mashq — har biri
 * bajarilmaguncha keyingisi ko'rinmaydi. Oxirida natija jurnalga yoziladi (streak + Nobu tahlili).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { useProgress } from '@/lib/progress';
import { logScience } from '@/lib/science';
import { checkNumber } from '@/science/engine';
import { AREAS, lessonById, lessonsOf, type Block } from '@/science/lessons';
import { SIMS } from '@/science/sims';
import { Choice } from '@/ui/choice';
import { NobuSays } from '@/ui/nobu';
import { Button, Card, T } from '@/ui/kit';

const gate = (b: Block) => b.k === 'predict' || b.k === 'sim' || b.k === 'ex' || b.k === 'choice';

export default function SciLesson() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id);
  const { completeLesson } = useProgress();
  const [upto, setUpto] = useState(0);              // nechanchi gate'gacha ochilgan
  const res = useRef({ correct: 0, total: 0, predicted: 0, predictTotal: 0, mistakes: [] as string[] });
  const [finished, setFinished] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  useEffect(() => { if (upto > 0) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 150); }, [upto]);
  if (!lesson) return <View style={s.root}><T>Dars topilmadi</T></View>;
  const area = AREAS.find((a) => a.id === lesson.area)!;

  // Ko'rinadigan bloklar: `upto` ta gate'dan o'tilgan + keyingi gate'gacha bo'lganlar
  let gates = 0, last = lesson.blocks.length;
  for (let i = 0; i < lesson.blocks.length; i++) {
    if (gate(lesson.blocks[i])) { if (gates === upto) { last = i + 1; break; } gates++; }
  }
  const visible = lesson.blocks.slice(0, last);
  const totalGates = countGates(lesson.blocks);
  const next = () => setUpto((u) => u + 1);

  const finish = () => {
    const r = res.current;
    completeLesson(`sci-${lesson.id}`, r.correct, r.total);
    logScience({ lesson: lesson.id, area: lesson.area, title: lesson.title, ...r });
    setFinished(true);
  };
  const nextLesson = lessonsOf(lesson.area).find((l) => l.n === lesson.n + 1);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T dim size={12}>{area.icon} {area.title} · {lesson.n}-dars</T>
          <T bold size={16}>{lesson.title}</T>
        </View>
        <T dim size={12}>{Math.min(upto, totalGates)}/{totalGates}</T>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 60 }]} keyboardShouldPersistTaps="handled">
        {visible.map((b, i) => <BlockView key={i} b={b} res={res.current} onDone={next} active={gate(b) && i === last - 1 && upto === gatesBefore(lesson.blocks, i)} />)}
        {upto >= totalGates && !finished && <Button label="✓ Darsni yakunlash" onPress={finish} />}
        {finished && (
          <Card style={{ gap: 8, borderColor: C.green }}>
            <T bold size={18}>Dars tugadi</T>
            <T>Mashqlar: {res.current.correct}/{res.current.total} · taxminlar: {res.current.predicted}/{res.current.predictTotal}</T>
            {res.current.mistakes.length > 0 && <T dim size={13}>Qaytarish kerak: {res.current.mistakes.join(' · ')}</T>}
            <Button label="🤖 Nobu bilan muhokama qilish" onPress={() => router.push({ pathname: '/nobu', params: { key: `lesson:${lesson.id}` } })} />
            {nextLesson && <Button kind="ghost" label={`Keyingi: ${nextLesson.title}`} onPress={() => router.replace(`/sci/${nextLesson.id}`)} />}
            <Button kind="ghost" label="Orqaga" onPress={() => router.back()} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function countGates(bs: Block[]) { return bs.filter(gate).length; }
function gatesBefore(bs: Block[], i: number) { return bs.slice(0, i).filter(gate).length; }

type Res = { correct: number; total: number; predicted: number; predictTotal: number; mistakes: string[] };

function BlockView({ b, res, onDone, active }: { b: Block; res: Res; onDone: () => void; active: boolean }) {
  switch (b.k) {
    case 'nobu': return <NobuSays text={b.text} />;
    case 'text': return <T size={16} style={{ lineHeight: 24 }}>{b.text}</T>;
    case 'law': return (
      <Card style={{ gap: 8, borderColor: '#FBBF24' }}>
        <T bold color="#FBBF24">📐 {b.title}</T>
        {b.formula.map((f) => <View key={f} style={s.formula}><Text style={s.formulaText}>{f}</Text></View>)}
        <T size={15}>{b.meaning}</T>
      </Card>
    );
    case 'example': return (
      <Card style={{ gap: 6 }}>
        <T bold>✏️ Misol: {b.title}</T>
        {b.steps.map((st, i) => <T key={i} size={15}>{i + 1}. {st}</T>)}
      </Card>
    );
    case 'predict': return <Predict b={b} res={res} onDone={onDone} active={active} />;
    case 'choice': return <Choice q={`🧠 ${b.q}`} options={b.options} answer={b.answer} why={b.why}
      onAnswer={(ok) => { res.total++; if (ok) res.correct++; else res.mistakes.push(b.q.slice(0, 60)); if (active) onDone(); }} />;
    case 'sim': return <SimBlock b={b} onDone={onDone} active={active} />;
    case 'ex': return <Exercise b={b} res={res} onDone={onDone} active={active} />;
  }
}

function Predict({ b, res, onDone, active }: { b: Extract<Block, { k: 'predict' }>; res: Res; onDone: () => void; active: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Card style={{ gap: 8, borderColor: '#A78BFA' }}>
      <T bold color="#A78BFA">🤔 Avval taxmin qiling</T>
      <T size={16}>{b.q}</T>
      {b.options.map((o) => (
        <Pressable key={o} disabled={!!picked} onPress={() => { setPicked(o); res.predictTotal++; if (o === b.answer) res.predicted++; }}
          style={[s.opt, picked && o === b.answer && s.right, picked === o && o !== b.answer && s.wrong]}>
          <Text style={{ color: C.text, fontSize: 15 }}>{o}</Text>
        </Pressable>
      ))}
      {picked && <T size={15}>{picked === b.answer ? '✓ To\'g\'ri taxmin. ' : '✗ Ko\'pchilik shunday o\'ylaydi. '}{b.reveal}</T>}
      {picked && active && <Button label="Davom etish" onPress={onDone} />}
    </Card>
  );
}

function SimBlock({ b, onDone, active }: { b: Extract<Block, { k: 'sim' }>; onDone: () => void; active: boolean }) {
  const sim = SIMS[b.id];
  if (!sim) return <T color={C.red}>Simulyatsiya topilmadi: {b.id}</T>;
  const Sim = sim.C;
  return (
    <Card style={{ gap: 10, borderColor: '#60A5FA' }}>
      <T bold color="#60A5FA">🧪 Tajriba: {sim.title}</T>
      <T size={15}>{b.task}</T>
      <Sim />
      {active && <Button label="Kuzatdim — davom etish" onPress={onDone} />}
    </Card>
  );
}

function Exercise({ b, res, onDone, active }: { b: Extract<Block, { k: 'ex' }>; res: Res; onDone: () => void; active: boolean }) {
  const [val, setVal] = useState('');
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<'open' | 'ok' | 'shown'>('open');
  const check = () => {
    if (!val.trim()) return;
    if (checkNumber(val, b.answer, b.tol ?? 0.02)) {
      setState('ok'); res.total++; res.correct++; return;
    }
    const n = tries + 1;
    setTries(n);
    if (n >= 2) { setState('shown'); res.total++; res.mistakes.push(b.q.slice(0, 60)); }
  };
  const giveUp = () => { setState('shown'); res.total++; res.mistakes.push(b.q.slice(0, 60)); };
  return (
    <Card style={{ gap: 8 }}>
      <T bold>🎯 Mashq</T>
      <T size={16}>{b.q}</T>
      {state === 'open' && (
        <>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput style={s.input} value={val} onChangeText={setVal} placeholder="javob" placeholderTextColor={C.dim}
              keyboardType="numbers-and-punctuation" onSubmitEditing={check} returnKeyType="done" />
            {b.unit ? <T dim>{b.unit}</T> : null}
          </View>
          {tries === 1 && <T color={C.red} size={14}>✗ Noto'g'ri. Maslahat: {b.hint}</T>}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}><Button label="Tekshirish" onPress={check} /></View>
            <View style={{ flex: 1 }}><Button kind="ghost" label="Yechim" onPress={giveUp} /></View>
          </View>
        </>
      )}
      {state !== 'open' && (
        <>
          <T bold color={state === 'ok' ? C.green : C.red}>{state === 'ok' ? `✓ To'g'ri${tries ? ' (2-urinishda)' : ''}` : `Javob: ${Number(b.answer.toFixed(3))}${b.unit ? ' ' + b.unit : ''}`}</T>
          <T size={14} dim>{b.solution}</T>
          {active && <Button label="Davom etish" onPress={onDone} />}
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  body: { padding: PAD, gap: 14 },
  formula: { padding: 12, borderRadius: 10, backgroundColor: C.codeBg },
  formulaText: { color: '#FDE68A', fontSize: 17, fontFamily: 'Menlo', textAlign: 'center' },
  opt: { padding: 12, borderRadius: 12, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  right: { backgroundColor: C.greenSoft, borderColor: C.green },
  wrong: { backgroundColor: C.redSoft, borderColor: C.red },
  input: { flex: 1, color: C.text, fontSize: 18, padding: 12, borderRadius: 12, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
