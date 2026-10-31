/**
 * sci/[id].tsx — Science darsi, BITTA QADAM bir ekranda (slayd kabi): kam matn, bitta g'oya.
 * Taxmin / simulyatsiya / mashq bajarilmaguncha "Keyingi" yopiq. Atamalar (qiyalik, urinma...) bosilsa — izoh.
 * Har qadamda "🤖 Tushunmadim" — Nobu shu qadamni boshqacha tushuntiradi.
 * Oxirida natija jurnalga yoziladi (streak + Nobu tahlili).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { useProgress } from '@/lib/progress';
import { logScience } from '@/lib/science';
import { checkNumber } from '@/science/engine';
import { AREAS, GLOSSARY, lessonById, lessonsOf, type Block } from '@/science/lessons';
import { Board } from '@/science/board';
import { SIMS } from '@/science/sims';
import { Button, Card, T } from '@/ui/kit';
import { NobuSays } from '@/ui/nobu';

const gate = (b: Block) => b.k === 'predict' || b.k === 'sim' || b.k === 'ex' || b.k === 'choice';
// O'zbekchada qo'shimchada k → g bo'ladi (qiyalik → qiyaligi), shuning uchun oxirgi k ham, g ham mos keladi
const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const pat = (t: string) => t.replace(/k$/, '[kg]');
const TERM_RE = new RegExp(`(${TERMS.map(pat).join('|')})`, 'i');
const termOf = (w: string) => TERMS.find((t) => new RegExp(`^${pat(t)}$`, 'i').test(w)) ?? w.toLowerCase();

/** Matn: lug'atdagi atamalar (har biri bir marta) bosiladigan, bosilsa ostida izoh. */
export function GlossText({ text, size = 17 }: { text: string; size?: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const seen = new Set<string>();
  const parts: React.ReactNode[] = [];
  let rest = text, i = 0;
  while (rest) {
    const m = rest.match(TERM_RE);
    if (!m || m.index === undefined) { parts.push(rest); break; }
    const term = termOf(m[1]);
    parts.push(rest.slice(0, m.index));
    if (seen.has(term)) parts.push(m[1]);
    else {
      seen.add(term);
      parts.push(<Text key={i++} onPress={() => setOpen(open === term ? null : term)} style={{ color: '#93C5FD', textDecorationLine: 'underline' }}>{m[1]}</Text>);
    }
    rest = rest.slice(m.index + m[1].length);
  }
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: C.text, fontSize: size, lineHeight: size * 1.45 }}>{parts}</Text>
      {open && <View style={s.gloss}><T size={14}><T bold size={14} color="#93C5FD">{open}</T> — {GLOSSARY[open]}</T></View>}
    </View>
  );
}

type Res = { answers: Record<number, boolean>; predicts: Record<number, boolean>; mistakes: Record<number, string> };

export default function SciLesson() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessonById(id);
  const { completeLesson } = useProgress();
  const [i, setI] = useState(0);
  const [resolved, setResolved] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const res = useRef<Res>({ answers: {}, predicts: {}, mistakes: {} });
  const scroll = useRef<ScrollViewInstance>(null);
  if (!lesson) return <View style={s.root}><T>Dars topilmadi</T></View>;

  const area = AREAS.find((a) => a.id === lesson.area)!;
  const blocks = lesson.blocks;
  const b = blocks[i];
  const canNext = !gate(b) || resolved[i];
  const go = (n: number) => { setI(n); scroll.current?.scrollTo({ y: 0, animated: false }); };

  const totals = () => {
    const a = Object.values(res.current.answers), p = Object.values(res.current.predicts);
    return { correct: a.filter(Boolean).length, total: a.length, predicted: p.filter(Boolean).length, predictTotal: p.length, mistakes: Object.values(res.current.mistakes) };
  };
  const finish = () => {
    const t = totals();
    completeLesson(`sci-${lesson.id}`, t.correct, t.total);
    logScience({ lesson: lesson.id, area: lesson.area, title: lesson.title, ...t });
    setFinished(true);
  };
  const ask = () => router.push({ pathname: '/nobu', params: { key: `lesson:${lesson.id}`, step: String(i) } });
  const nextLesson = lessonsOf(lesson.area).find((l) => l.n === lesson.n + 1);
  const t = totals();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T dim size={12}>{area.icon} {area.title} · {lesson.n}-dars</T>
          <T bold size={16}>{lesson.title}</T>
        </View>
      </View>
      <View style={s.dots}>
        {blocks.map((_, k) => <View key={k} style={[s.dot, k < i && { backgroundColor: area.color }, k === i && { backgroundColor: '#fff' }]} />)}
      </View>

      <ScrollView ref={scroll} contentContainerStyle={[s.body]} keyboardShouldPersistTaps="handled">
        {finished ? (
          <Card style={{ gap: 10, borderColor: C.green }}>
            <T bold size={20}>✅ Dars tugadi</T>
            <T>Mashqlar: {t.correct}/{t.total} · taxminlar: {t.predicted}/{t.predictTotal}</T>
            {t.mistakes.length > 0 && <T dim size={14}>Qaytarish kerak: {t.mistakes.join(' · ')}</T>}
            <Button label="🤖 Nobu bilan muhokama qilish" onPress={() => router.push({ pathname: '/nobu', params: { key: `lesson:${lesson.id}` } })} />
            {nextLesson && <Button kind="ghost" label={`Keyingi dars: ${nextLesson.title}`} onPress={() => router.replace(`/sci/${nextLesson.id}`)} />}
            <Button kind="ghost" label="Orqaga" onPress={() => router.back()} />
          </Card>
        ) : (
          <BlockView key={i} b={b} idx={i} res={res.current} solved={!!resolved[i]} onResolved={() => setResolved((r) => ({ ...r, [i]: true }))} />
        )}
      </ScrollView>

      {!finished && (
        <View style={[s.bar, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable onPress={() => i > 0 && go(i - 1)} disabled={i === 0} style={[s.navBtn, i === 0 && { opacity: 0.3 }]}><T size={20}>‹</T></Pressable>
          <Pressable onPress={ask} style={s.askBtn}><T size={14}>🤖 Tushunmadim</T></Pressable>
          <Pressable disabled={!canNext} onPress={() => (i + 1 < blocks.length ? go(i + 1) : finish())}
            style={[s.nextBtn, { backgroundColor: canNext ? C.green : 'rgba(255,255,255,0.08)' }]}>
            <Text style={{ color: canNext ? C.bg : C.dim, fontWeight: '800', fontSize: 16 }}>
              {!canNext ? (b.k === 'sim' ? 'Sinab ko\'ring' : 'Javob bering') : i + 1 < blocks.length ? 'Keyingi ›' : 'Yakunlash ✓'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function BlockView({ b, idx, res, solved, onResolved }: { b: Block; idx: number; res: Res; solved: boolean; onResolved: () => void }) {
  switch (b.k) {
    case 'nobu': return <NobuSays text={b.text} />;
    case 'board': return <Board id={b.id} />;
    case 'text': return <Card><GlossText text={b.text} /></Card>;
    case 'law': return (
      <Card style={{ gap: 10, borderColor: '#FBBF24' }}>
        <T bold color="#FBBF24">📐 {b.title}</T>
        {b.formula.map((f) => <View key={f} style={s.formula}><Text style={s.formulaText}>{f}</Text></View>)}
        <GlossText text={b.meaning} size={16} />
      </Card>
    );
    case 'example': return (
      <Card style={{ gap: 8 }}>
        <T bold>✏️ Misol: {b.title}</T>
        {b.steps.map((st, k) => <View key={k} style={s.step}><T bold color={C.green}>{k + 1}</T><View style={{ flex: 1 }}><GlossText text={st} size={16} /></View></View>)}
      </Card>
    );
    case 'predict': return <Options title="🤔 Avval taxmin qiling" color="#A78BFA" q={b.q} options={b.options} answer={b.answer} after={b.reveal} soft
      onPick={(ok) => { res.predicts[idx] = ok; onResolved(); }} />;
    case 'choice': return <Options title="🧠 Savol" color={C.green} q={b.q} options={b.options} answer={b.answer} after={b.why}
      onPick={(ok) => { res.answers[idx] = ok; if (!ok) res.mistakes[idx] = b.q.slice(0, 60); onResolved(); }} />;
    case 'sim': return <SimBlock b={b} onTouched={onResolved} solved={solved} />;
    case 'ex': return <Exercise b={b} onResult={(ok) => { res.answers[idx] = ok; if (!ok) res.mistakes[idx] = b.q.slice(0, 60); else delete res.mistakes[idx]; onResolved(); }} />;
  }
}

function Options({ title, color, q, options, answer, after, soft, onPick }: {
  title: string; color: string; q: string; options: string[]; answer: string; after: string; soft?: boolean; onPick: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Card style={{ gap: 10, borderColor: color }}>
      <T bold color={color}>{title}</T>
      <GlossText text={q} size={18} />
      {options.map((o) => (
        <Pressable key={o} disabled={!!picked} onPress={() => { setPicked(o); onPick(o === answer); }}
          style={[s.opt, picked && o === answer && s.right, picked === o && o !== answer && s.wrong]}>
          <Text style={{ color: C.text, fontSize: 16 }}>{o}</Text>
        </Pressable>
      ))}
      {picked && (
        <View style={{ gap: 4 }}>
          <T bold color={picked === answer ? C.green : soft ? '#A78BFA' : C.red}>
            {picked === answer ? "✓ To'g'ri" : soft ? 'Qiziq — ko\'pchilik shunday o\'ylaydi' : '✗ Noto\'g\'ri'}
          </T>
          <GlossText text={after} size={16} />
        </View>
      )}
    </Card>
  );
}

function SimBlock({ b, onTouched, solved }: { b: Extract<Block, { k: 'sim' }>; onTouched: () => void; solved: boolean }) {
  const sim = SIMS[b.id];
  if (!sim) return <T color={C.red}>Simulyatsiya topilmadi: {b.id}</T>;
  const Sim = sim.C;
  return (
    <View style={{ gap: 10 }}>
      <View style={s.task}><T bold color="#60A5FA">🧪 {sim.title}</T><GlossText text={b.task} size={16} /></View>
      {/* Birinchi tegishda "Keyingi" ochiladi — avval o'zingiz sinab ko'ring */}
      <View onTouchStart={() => { if (!solved) onTouched(); }} onPointerDown={() => { if (!solved) onTouched(); }}>
        <Sim />
      </View>
    </View>
  );
}

function Exercise({ b, onResult }: { b: Extract<Block, { k: 'ex' }>; onResult: (ok: boolean) => void }) {
  const [val, setVal] = useState('');
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<'open' | 'ok' | 'shown'>('open');
  const check = () => {
    if (!val.trim()) return;
    if (checkNumber(val, b.answer, b.tol ?? 0.02)) { setState('ok'); onResult(true); return; }
    const n = tries + 1;
    setTries(n);
    if (n >= 2) { setState('shown'); onResult(false); }
  };
  return (
    <Card style={{ gap: 10 }}>
      <T bold>🎯 Mashq</T>
      <GlossText text={b.q} size={18} />
      {state === 'open' && (
        <>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput style={s.input} value={val} onChangeText={setVal} placeholder="javob" placeholderTextColor={C.dim}
              keyboardType="numbers-and-punctuation" onSubmitEditing={check} returnKeyType="done" />
            {b.unit ? <T dim>{b.unit}</T> : null}
          </View>
          {tries === 1 && <T color={C.red} size={15}>✗ Hali emas. Maslahat: {b.hint}</T>}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}><Button label="Tekshirish" onPress={check} /></View>
            <View style={{ flex: 1 }}><Button kind="ghost" label="Yechim" onPress={() => { setState('shown'); onResult(false); }} /></View>
          </View>
        </>
      )}
      {state !== 'open' && (
        <>
          <T bold color={state === 'ok' ? C.green : C.red}>{state === 'ok' ? `✓ To'g'ri${tries ? ' (2-urinishda)' : ''}` : `Javob: ${Number(b.answer.toFixed(3))}${b.unit ? ' ' + b.unit : ''}`}</T>
          <GlossText text={b.solution} size={15} />
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8 },
  dots: { flexDirection: 'row', gap: 4, paddingHorizontal: PAD, paddingBottom: 8 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  body: { padding: PAD, gap: 14, paddingBottom: 40 },
  bar: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: PAD, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  navBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  askBtn: { height: 48, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cardBorder },
  nextBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gloss: { padding: 10, borderRadius: 10, backgroundColor: 'rgba(147,197,253,0.1)', borderWidth: 1, borderColor: 'rgba(147,197,253,0.3)' },
  task: { gap: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  formula: { padding: 12, borderRadius: 10, backgroundColor: C.codeBg },
  formulaText: { color: '#FDE68A', fontSize: 18, fontFamily: 'Menlo', textAlign: 'center' },
  opt: { padding: 14, borderRadius: 12, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  right: { backgroundColor: C.greenSoft, borderColor: C.green },
  wrong: { backgroundColor: C.redSoft, borderColor: C.red },
  input: { flex: 1, color: C.text, fontSize: 18, padding: 12, borderRadius: 12, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
