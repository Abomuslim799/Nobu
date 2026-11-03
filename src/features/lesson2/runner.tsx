/**
 * runner.tsx — bitta rejimni (low / medium / high) qadamma-qadam o'tkazadi.
 * Har qadam: Ustoz aytadi, doskada chiziladi; savol bo'lsa — javob doskada (tap, drag) yoki ostida (son, variant, xato qadam).
 * Ballga faqat birinchi urinish kiradi. Xato javobda — aniq izoh (tuzoq javoblar uchun alohida).
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';

import { markActive } from '@/core/activity';
import { C } from '@/core/theme';
import { Avatar } from '@/core/ui/avatar';
import { Bar, Button, T } from '@/core/ui/kit';
import { Board2, FORMULA_C, hasBoard, type BoardInput } from '@/features/lesson2/board';
import { FeynmanChat } from '@/features/lesson2/feynman';
import { useVoice } from '@/features/lesson2/voice';
import { checkNum, type Step, type Topic2, type XY } from '@/features/lesson2/types';

export interface RunResult { correct: number; total: number; mistakes: string[]; feyn?: number | null }
type Fb = { ok: boolean; msg: string } | null;

export function Runner({ topic, steps, onDone }: { topic: Topic2; steps: Step[]; onDone: (r: RunResult) => void }) {
  const voice = useVoice(topic.id);
  const [i, setI] = useState(0);
  const [fb, setFb] = useState<Fb>(null);
  const [solved, setSolved] = useState(false);
  const [text, setText] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const [drag, setDrag] = useState<XY>([0, 0]);
  const [feyn, setFeyn] = useState<number | null | undefined>(undefined);
  const res = useRef<{ first: Record<number, boolean>; mistakes: string[] }>({ first: {}, mistakes: [] });
  const scroll = useRef<ScrollViewInstance>(null);
  const st = steps[i];
  const q = st.ask?.q;

  // Qadam ochilganda: holatni tozalash, Ustoz gapiradi
  useEffect(() => {
    setFb(null); setSolved(false); setText(''); setPick(null);
    if (q?.t === 'drag') setDrag(q.start);
    const t = setTimeout(() => voice.say(st.say), 250);
    scroll.current?.scrollTo({ y: 0, animated: false });
    return () => clearTimeout(t);
  }, [i]);
  useEffect(() => () => voice.stop(), []);

  const answer = (ok: boolean, msg?: string) => {
    markActive();
    const a = st.ask;
    if (!a) return;
    if (!(i in res.current.first)) {
      res.current.first[i] = ok;
      if (!ok) res.current.mistakes.push(st.sub ? `${st.sub}: ${a.prompt}` : a.prompt);
    }
    const m = ok ? a.ok : msg ?? a.no;
    setFb({ ok, msg: m });
    if (ok) setSolved(true);
    voice.say(m);
  };
  const reveal = () => { setSolved(true); setFb({ ok: false, msg: st.ask?.no ?? '' }); };

  const next = () => {
    voice.stop();
    if (i + 1 < steps.length) { setI(i + 1); return; }
    const first = Object.values(res.current.first);
    onDone({ correct: first.filter(Boolean).length, total: first.length, mistakes: res.current.mistakes, feyn });
  };

  // Doskadagi javob
  let input: BoardInput | undefined;
  if (q?.t === 'tap') {
    const marks: Record<string, string> = {};
    if (pick) marks[pick] = pick === q.answer ? C.good : C.red;
    if (solved) marks[q.answer] = C.good;
    input = solved ? { marks } : { marks, tap: { targets: q.targets, onTap: (id) => { setPick(id); answer(id === q.answer); } } };
  } else if (q?.t === 'drag' && !solved) {
    input = { drag: { fixed: q.fixed, pos: drag, onMove: (p) => { markActive(); setDrag(p); setFb(null); } } };
  } else if (q?.t === 'drag' && solved) {
    input = { drag: { fixed: q.fixed, pos: drag, onMove: () => {} } };
  }

  const canNext = !q || solved || (q.t === 'feynman' && feyn !== undefined);
  const dx = drag[0] - (q?.t === 'drag' ? q.fixed[0] : 0), dy = drag[1] - (q?.t === 'drag' ? q.fixed[1] : 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, gap: 6, paddingBottom: 6 }}>
        <Bar value={(i + (canNext ? 1 : 0)) / steps.length} color={C.gold} />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {hasBoard(steps, i) && <Board2 steps={steps} n={i} input={input} />}

        {/* Ustoz: subtitr (kalit so'zlar) */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.cardBorder }}>
          <Avatar who="ustoz" pose={voice.busy ? 'tushuntir' : 'kitob'} size={34} />
          <View style={{ flex: 1, gap: 2 }}>
            <T size={16}>{st.sub ?? st.say}</T>
            {!!voice.err && voice.on && <T dim size={11}>⚠️ Ovoz: {voice.err}</T>}
          </View>
          <Pressable onPress={() => (voice.busy ? voice.stop() : voice.say(st.say))} hitSlop={10}><T size={18}>{voice.busy ? '⏸' : '🔁'}</T></Pressable>
          <Pressable onPress={voice.toggle} hitSlop={10}><T size={18}>{voice.on ? '🔊' : '🔇'}</T></Pressable>
        </View>

        {st.card && <View style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.goldSoft, backgroundColor: C.goldSoft }}><T size={14}>📇 Takror kartasi: <T bold size={14}>{st.card}</T></T></View>}

        {st.ask && (
          <View style={{ gap: 8 }}>
            <T bold size={16}>{q?.t === 'tap' && !solved ? '👆 ' : q?.t === 'drag' && !solved ? '✋ ' : ''}{st.ask.prompt}</T>

            {q?.t === 'num' && !solved && (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput value={text} onChangeText={(t) => { setText(t); setFb(null); }} keyboardType="numbers-and-punctuation" placeholder="javob"
                  placeholderTextColor={C.dim} onSubmitEditing={() => { const r = checkNum(text, q); answer(r.ok, r.trap); }}
                  style={{ flex: 1, minWidth: 0, color: C.text, fontSize: 20, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card }} />
                {!!q.unit && <T dim>{q.unit}</T>}
                <View style={{ width: 118, flexShrink: 0 }}><Button label="Tekshirish" disabled={!text.trim()} onPress={() => { const r = checkNum(text, q); answer(r.ok, r.trap); }} /></View>
              </View>
            )}

            {q?.t === 'choice' && q.options.map((o) => {
              const chosen = pick === o, right = solved && o === q.answer;
              return (
                <Pressable key={o} disabled={solved} onPress={() => { setPick(o); answer(o === q.answer); }}
                  style={{ padding: 13, borderRadius: 12, borderWidth: 1.5, backgroundColor: C.card,
                    borderColor: right ? C.good : chosen ? C.red : C.cardBorder }}>
                  <T size={16}>{o}</T>
                </Pressable>
              );
            })}

            {q?.t === 'steps' && q.lines.map((l, k) => {
              const chosen = pick === String(k), right = solved && k === q.wrong;
              return (
                <Pressable key={k} disabled={solved} onPress={() => { setPick(String(k)); answer(k === q.wrong); }}
                  style={{ padding: 12, borderRadius: 10, backgroundColor: C.codeBg, borderWidth: 1.5,
                    borderColor: right ? C.red : chosen ? C.gold : C.cardBorder }}>
                  <T size={17} color={FORMULA_C}>{l}{right ? '   ← xato' : ''}</T>
                </Pressable>
              );
            })}

            {q?.t === 'drag' && (
              <View style={{ gap: 8 }}>
                <T dim size={14}>Δx = {dx} · Δy = {dy}</T>
                {!solved && <Button label="Tekshirish" disabled={dx === 0 && dy === 0} onPress={() => answer(q.ok(drag))} />}
              </View>
            )}

            {q?.t === 'feynman' && <FeynmanChat title={topic.title} spec={topic.feynman} onScore={(s) => { setFeyn(s); markActive(); }} />}

            {fb && (
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: fb.ok ? 'rgba(74,222,128,0.14)' : C.redSoft, borderWidth: 1, borderColor: fb.ok ? C.good : C.red }}>
                <T size={15}>{fb.ok ? '✅ ' : '❌ '}{fb.msg}</T>
              </View>
            )}
            {fb && !fb.ok && !solved && q?.t !== 'feynman' && (
              <Pressable onPress={reveal} hitSlop={8}><T dim size={13} style={{ textDecorationLine: 'underline' }}>Javobni ko'rsatish</T></Pressable>
            )}
          </View>
        )}

        <Button label={i + 1 < steps.length ? 'Davom ›' : 'Yakunlash ✓'} onPress={next} disabled={!canNext} />
        <T dim size={12} style={{ textAlign: 'center' }}>{i + 1} / {steps.length}</T>
      </ScrollView>
    </View>
  );
}

