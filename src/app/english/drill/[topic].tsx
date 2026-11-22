/**
 * english/drill/[topic].tsx — bitta mavzu sessiyasi: Recall → Drill (UZ → EN, vaqt chegarasi) → Speak → Natija.
 *   topic = 'mistakes' — mistake bank sessiyasi (barcha mavzular xatolari, recall/speak yo'q).
 *   Xato javob mistake bank'ga tushadi; ketma-ket 2 marta to'g'ri bo'lsa — chiqadi.
 *   ❓ — istalgan paytda Ustozdan so'rash (Gemini, mavzu va xatolar konteksti bilan).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dayKey } from '@/core/date';
import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { judge, speakCheck } from '@/features/english/drill/ai';
import { contentOf, type DrillItem } from '@/features/english/drill/content';
import {
  STATUS, addMistake, answerMistake, drillCount, matches, phaseOf, statusOf, topicMinutes, weekOf, type Mistake,
} from '@/features/english/drill/logic';
import { extraKey, loadDrill, saveDrill, type DrillData } from '@/features/english/drill/store';
import { topicById } from '@/features/english/drill/topics';

type Step = 'recall' | 'drill' | 'speak' | 'done';
interface Q { topic: string; item: DrillItem; fromBank: boolean }
interface Answer { q: Q; text: string; right: boolean; sec: number; timeout: boolean }

const shuffle = <X,>(a: X[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

/** Navbat: avval shu mavzuning mistake bank'i (ko'pi bilan 1/3), keyin yangi gaplar. */
function buildQueue(topic: string, data: DrillData, n: number): Q[] {
  if (topic === 'mistakes') {
    return [...data.mistakes].sort((a, b) => a.at - b.at).slice(0, 20)
      .map((m) => ({ topic: m.topic, item: { uz: m.uz, en: m.en }, fromBank: true }));
  }
  const c = contentOf(topic);
  if (!c) return [];
  const bank = data.mistakes.filter((m) => m.topic === topic).slice(0, Math.ceil(n / 3));
  const inBank = new Set(bank.map((m) => m.uz));
  const fresh = shuffle(c.items.filter((i) => !inBank.has(i.uz))).slice(0, n - bank.length);
  return shuffle([...bank.map((m) => ({ topic, item: { uz: m.uz, en: m.en }, fromBank: true })), ...fresh.map((item) => ({ topic, item, fromBank: false }))]);
}

export default function DrillSession() {
  const insets = useSafeAreaInsets();
  const { topic = '' } = useLocalSearchParams<{ topic: string }>();
  const isBank = topic === 'mistakes';
  const meta = topicById(topic);
  const content = contentOf(topic);
  const today = dayKey();
  const limit = phaseOf(Math.max(1, weekOf(today))).limit;

  const [data, setData] = useState<DrillData | null>(null);
  const [step, setStep] = useState<Step>(isBank ? 'drill' : 'recall');
  const [queue, setQueue] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  useEffect(() => {
    answersRef.current = [];
    loadDrill().then((d) => {
      setData(d);
      const n = meta ? drillCount(topicMinutes(meta, statusOf(d.results, topic))) : 20;
      setQueue(buildQueue(topic, d, n));
    });
  }, [topic]);

  const persist = async (next: DrillData) => { setData(next); await saveDrill(next); };

  const header = (
    <View style={s.top}>
      <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
      <T bold size={17} style={{ flex: 1 }} lines={1}>{isBank ? '🔁 Mistake bank' : meta?.title ?? topic}</T>
      <Pressable onPress={() => router.push({ pathname: '/nobu/chat', params: { key: `drill:${isBank ? (queue[i]?.topic ?? '') : topic}` } })} hitSlop={10}>
        <T size={15} color={C.green}>❓ Savol</T>
      </Pressable>
    </View>
  );

  if (!data) return <View style={[s.root, { paddingTop: insets.top }]}>{header}</View>;
  if (!isBank && !content) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>{header}
        <View style={s.body}><T dim>Bu mavzu kontenti hali tayyor emas.</T></View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {step === 'recall' && content && <Recall content={content} onStart={() => setStep('drill')} />}
        {step === 'drill' && (
          queue.length === 0
            ? <><T dim>{isBank ? "Mistake bank bo'sh — zo'r. Hammasi tozalangan." : "Savol yo'q."}</T><Button label="Orqaga" onPress={() => router.back()} /></>
            : <Drill key={i} q={queue[i]} n={i + 1} total={queue.length} limit={limit} data={data} topicTitle={meta?.title ?? ''}
                onAnswer={persist}
                onNext={async () => {
                  if (i + 1 < queue.length) { setI(i + 1); return; }
                  if (!isBank && meta) {
                    const all = answersRef.current;
                    const acc = Math.round((all.filter((x) => x.right).length / all.length) * 100);
                    const avgSec = all.reduce((sum, x) => sum + x.sec, 0) / all.length;
                    const d = await loadDrill();
                    await persist({ ...d, results: [...d.results, { topic, at: Date.now(), day: today, acc, avgSec, limit, n: all.length }] });
                  }
                  setStep(isBank ? 'done' : 'speak');
                }} />
        )}
        {step === 'speak' && content && <Speak topic={meta?.title ?? ''} tasks={content.speak} onDone={() => setStep('done')} />}
        {step === 'done' && <Done data={data} topic={topic} isBank={isBank} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Sessiya javoblari — ref'da (onNext va taymer ichida eskirib qolmasligi uchun)
const answersRef = { current: [] as Answer[] };

// ── 1. Recall: avval o'zing ayt, keyin tekshir ───────────────────────────────
function Recall({ content, onStart }: { content: NonNullable<ReturnType<typeof contentOf>>; onStart: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <T dim size={13}>1/3 · RECALL — avval o'zing ovoz chiqarib ayt</T>
      <Card><T bold size={17}>{content.recall}</T></Card>
      {!show ? <Button kind="ghost" label="Aytdim — tekshirish" onPress={() => setShow(true)} /> : (
        <>
          {content.formula.map((f, k) => <Card key={k}><T>{f}</T></Card>)}
          {content.pairs.map((p, k) => (
            <Card key={k} style={{ gap: 4 }}>
              <T>{p.a}</T><T>{p.b}</T><T dim size={13}>{p.note_uz}</T>
            </Card>
          ))}
          {!!content.film?.length && <T bold>🎬 Filmda</T>}
          {content.film?.map((f, k) => (
            <Card key={`f${k}`} style={{ gap: 4 }}>
              <T dim size={12}>{f.src}</T><T>{f.en}</T><T dim size={13}>{f.note_uz}</T>
            </Card>
          ))}
        </>
      )}
      <Button label="Drill'ni boshlash →" onPress={onStart} />
    </>
  );
}

// ── 2. Drill: UZ → EN, har gapga vaqt chegarasi ──────────────────────────────
function Drill({ q, n, total, limit, data, topicTitle, onAnswer, onNext }: {
  q: Q; n: number; total: number; limit: number; data: DrillData; topicTitle: string;
  onAnswer: (next: DrillData) => Promise<void>; onNext: () => void;
}) {
  const [text, setText] = useState('');
  const [res, setRes] = useState<Answer | null>(null);
  const [left, setLeft] = useState(limit);
  const [ai, setAi] = useState<{ busy: boolean; why?: string; err?: string }>({ busy: false });
  const t0 = useRef(0);
  const answered = useRef(false);
  const textRef = useRef('');
  const onText = (v: string) => { textRef.current = v; setText(v); };
  const accepted = useMemo(() => [...q.item.en, ...(data.extra[extraKey(q.topic, q.item.uz)] ?? [])], [q, data]);

  const submit = async (timeout = false) => {
    if (answered.current) return;
    answered.current = true;
    const sec = Math.min(limit, (Date.now() - t0.current) / 1000);
    const answer = textRef.current;
    const right = !timeout && matches(answer, accepted);
    const a: Answer = { q, text: answer, right, sec, timeout };
    setRes(a);
    answersRef.current = [...answersRef.current, a];
    let next = data;
    if (right && q.fromBank) next = { ...data, mistakes: answerMistake(data.mistakes, q.topic, q.item.uz, true) };
    if (!right) next = { ...data, mistakes: q.fromBank ? answerMistake(data.mistakes, q.topic, q.item.uz, false, answer)
      : addMistake(data.mistakes, { topic: q.topic, uz: q.item.uz, en: q.item.en, wrong: answer }) };
    await onAnswer(next);
  };

  useEffect(() => {
    t0.current = Date.now();
    const t = setInterval(() => {
      const l = Math.max(0, limit - (Date.now() - t0.current) / 1000);
      setLeft(l);
      if (answered.current) { clearInterval(t); return; }
      if (l <= 0) { clearInterval(t); submit(true); }
    }, 250);
    return () => clearInterval(t);
  }, []);

  /** AI "to'g'ri" desa: javob qabul qilinadi, keyingi safar avtomatik o'tadi, xato bank'dan qaytariladi. */
  const appeal = async () => {
    if (!res || !res.text.trim()) return;
    setAi({ busy: true });
    try {
      const j = await judge(topicTitle, q.item.uz, res.text, q.item.en);
      if (!j.ok) { setAi({ busy: false, why: `❌ ${j.why}` }); return; }
      const key = extraKey(q.topic, q.item.uz);
      const d = await loadDrill();
      const fixed: Mistake[] = q.fromBank ? answerMistake(d.mistakes, q.topic, q.item.uz, true)
        : d.mistakes.filter((m) => !(m.topic === q.topic && m.uz === q.item.uz));
      const next = { ...d, mistakes: fixed, extra: { ...d.extra, [key]: [...(d.extra[key] ?? []), res.text.trim()] } };
      await onAnswer(next);
      const ok = { ...res, right: true };
      answersRef.current = answersRef.current.map((x) => (x === res ? ok : x));
      setRes(ok);
      setAi({ busy: false, why: `✅ ${j.why}` });
    } catch (e) {
      setAi({ busy: false, err: e instanceof Error ? e.message : String(e) });
    }
  };

  const late = !res && left < limit * 0.3;
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T dim size={13}>2/3 · DRILL {n}/{total}{q.fromBank ? ' · 🔁 xato edi' : ''}</T>
        <T size={13} color={late ? C.red : C.dim}>{res ? `${res.sec.toFixed(1)} s` : `${Math.ceil(left)} s`}</T>
      </View>
      <Bar value={res ? 1 : left / limit} color={late ? C.red : C.green} />
      <Card><T bold size={19}>{q.item.uz}</T></Card>
      <TextInput style={s.input} value={text} onChangeText={onText} editable={!res} autoFocus multiline
        autoCapitalize="sentences" autoCorrect={false} placeholder="English…" placeholderTextColor={C.dim}
        blurOnSubmit onSubmitEditing={() => submit()} returnKeyType="done" />
      {!res ? <Button label="Tekshirish" onPress={() => submit()} disabled={!text.trim()} /> : (
        <>
          <Card style={{ borderColor: res.right ? C.green : C.red, gap: 6 }}>
            <T bold color={res.right ? C.green : C.red}>{res.right ? "✅ To'g'ri" : res.timeout ? '⏱ Vaqt tugadi' : '❌ Xato'}</T>
            {!res.right && <T>{q.item.en[0]}</T>}
            {!res.right && q.item.en.length > 1 && <T dim size={13}>Yana: {q.item.en.slice(1, 3).join(' · ')}</T>}
          </Card>
          {!res.right && !!res.text.trim() && !ai.why && (
            <Button kind="ghost" label={ai.busy ? '⏳ Ustoz tekshiryapti…' : "🤔 Mening javobim ham to'g'ri"} disabled={ai.busy} onPress={appeal} />
          )}
          {!!ai.why && <T size={14}>{ai.why}</T>}
          {!!ai.err && <T size={13} color={C.red}>{ai.err}</T>}
          <Button label={n < total ? 'Keyingi →' : 'Yakunlash →'} onPress={onNext} />
        </>
      )}
    </>
  );
}

// ── 3. Speak: o'z hayotingdan gaplar (klaviaturadagi 🎤 diktovka) ─────────────
function Speak({ topic, tasks, onDone }: { topic: string; tasks: string[]; onDone: () => void }) {
  const [task] = useState(() => tasks[Math.floor(Math.random() * tasks.length)]);
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const check = async () => {
    setBusy(true); setErr('');
    try { setReply(await speakCheck(topic, task, text)); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <T dim size={13}>3/3 · SPEAK — klaviaturadagi 🎤 bosib gapir</T>
      <Card><T bold size={17}>{task}</T></Card>
      <TextInput style={[s.input, { minHeight: 140 }]} value={text} onChangeText={setText} multiline
        placeholder="5 ta gap…" placeholderTextColor={C.dim} editable={!reply} />
      {!reply && <Button label={busy ? '⏳ Ustoz tekshiryapti…' : 'Tekshirish'} disabled={busy || text.trim().length < 20} onPress={check} />}
      {!!err && <T size={13} color={C.red}>{err}</T>}
      {!!reply && <Card><T>{reply}</T></Card>}
      <Button kind={reply ? 'primary' : 'ghost'} label={reply ? 'Natija →' : "Speaking'siz yakunlash"} onPress={onDone} />
    </>
  );
}

// ── Natija ──────────────────────────────────────────────────────────────────
function Done({ data, topic, isBank }: { data: DrillData; topic: string; isBank: boolean }) {
  const all = answersRef.current;
  const right = all.filter((a) => a.right).length;
  const acc = all.length ? Math.round((right / all.length) * 100) : 0;
  const avg = all.length ? all.reduce((sum, a) => sum + a.sec, 0) / all.length : 0;
  const st = statusOf(data.results, topic);
  const wrong = all.filter((a) => !a.right);
  return (
    <>
      <Card style={{ gap: 6 }}>
        <T bold size={22}>{acc}% · {right}/{all.length}</T>
        <T dim>O'rtacha javob: {avg.toFixed(1)} s</T>
        {!isBank && <T bold color={STATUS[st].color}>Mavzu holati: {STATUS[st].label}</T>}
        <T dim size={13}>Mistake bank: {data.mistakes.length} ta gap</T>
      </Card>
      {wrong.length > 0 && <T bold>Xatolar</T>}
      {wrong.map((a, k) => (
        <Card key={k} style={{ gap: 4 }}>
          <T dim size={13}>{a.q.item.uz}</T>
          {!!a.text.trim() && <T color={C.red}>{a.text}</T>}
          <T color={C.green}>{a.q.item.en[0]}</T>
        </Card>
      ))}
      <Button label="Bugungi reja" onPress={() => router.back()} />
    </>
  );
}
