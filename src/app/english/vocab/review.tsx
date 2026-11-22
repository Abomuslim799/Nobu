/**
 * english/vocab/review.tsx — cheksiz takror ("time killer"): har safar eng yuqori balli so'z
 * (Hard tez-tez, Easy kam). Har so'zga 1 savol, turi aralash, 4 variant.
 * Avval javob topiladi, keyin o'sha rasm yengil animatsiya bilan. To'g'ri — o'zi keyingisiga o'tadi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { say, stopSpeaking } from '@/features/english/speak';
import { makeQuestion, QTYPE_LABEL, type VQuestion } from '@/features/english/vocab/question';
import { REVIEW_MIN, STATUS_UI, decay, nextReadyIn, reviewOrder, type Kind, type Status } from '@/features/english/vocab/srs';
import { summary, useVocab } from '@/features/english/vocab/store';
import { PicturePop, Prompt, s as vs } from '@/features/english/vocab/ui';

export default function Review() {
  const insets = useSafeAreaInsets();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = k === 'colloc' ? 'colloc' : 'word';
  const { v, items, answer } = useVocab();

  const pool = useMemo(() => items.filter((w) => w.kind === kind), [items, kind]);
  const byId = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);
  const [q, setQ] = useState<VQuestion | null>(null);
  const [empty, setEmpty] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [session, setSession] = useState({ n: 0, right: 0 });
  const t0 = useRef(0);
  const lastId = useRef<string | undefined>(undefined);
  const [before, setBefore] = useState<Status | null>(null);

  const pickNext = () => {
    if (!v) return;
    const ids = pool.map((w) => w.id);
    const [id] = reviewOrder(v.states, ids, Date.now(), lastId.current);
    if (!id) { setQ(null); setEmpty(nextReadyIn(v.states, ids)); return; }
    const learnedPool = pool.filter((w) => v.states[w.id]);
    setQ(makeQuestion(byId.get(id)!, learnedPool.length >= 12 ? learnedPool : pool));
    setBefore(decay(v.states[id]).st);
    setPicked(null); setEmpty(null);
    t0.current = Date.now();
  };

  // Birinchi savol — ma'lumot yuklangach.
  const started = useRef(false);
  useEffect(() => { if (v && !started.current) { started.current = true; pickNext(); } });

  useEffect(() => {
    if (q?.type === 'audio') say(q.item.id, 'w', q.item.word);
    return stopSpeaking;
  }, [q]);

  // To'g'ri javobdan keyin — o'zi keyingisiga (transportda bir qo'l bilan tez).
  useEffect(() => {
    if (!q || picked !== q.answer) return;
    const t = setTimeout(pickNext, 1100);
    return () => clearTimeout(t);
  });

  const choose = (o: string) => {
    if (!q || picked) return;
    const right = o === q.answer;
    const sec = (Date.now() - t0.current) / 1000;
    setPicked(o);
    lastId.current = q.item.id;
    answer(q.item.id, kind, right, sec, q.fastSec);
    setSession((x) => ({ n: x.n + 1, right: x.right + (right ? 1 : 0) }));
    if (q.type !== 'audio') say(q.item.id, 'w', q.item.word);
  };

  const sum = v ? summary(v, items, kind) : null;
  const now = q && picked && v?.states[q.item.id] ? decay(v.states[q.item.id]).st : null;   // javobdan keyingi status

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <T bold style={{ flex: 1 }}>🔁 Takror · {session.n} ta{session.n ? ` · ${Math.round((session.right / session.n) * 100)}%` : ''}</T>
        {sum && <T dim color={sum.reviewed >= REVIEW_MIN ? C.good : C.dim}>bugun {sum.reviewed}/{REVIEW_MIN}</T>}
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        {!q && empty !== null && (
          <Card style={{ alignItems: 'center', gap: 8 }}>
            <T bold size={20}>Hozir takrorlanadigan so'z yo'q</T>
            <T dim>Keyingisi ~{Math.max(1, Math.ceil(empty / 60000))} daqiqadan keyin. Yangi so'z o'rganing.</T>
            <Button label="Yangi so'zlar" onPress={() => router.replace(`/english/vocab/learn?kind=${kind}`)} />
          </Card>
        )}
        {q && (
          <>
            <View style={{ flexDirection: 'row' }}>
              <T dim size={13} style={{ flex: 1 }}>{QTYPE_LABEL[q.type]}</T>
              {before && <T size={13} bold color={STATUS_UI[now ?? before].color}>{STATUS_UI[before].label}{now && now !== before ? ` → ${STATUS_UI[now].label}` : ''}</T>}
            </View>
            <Prompt q={q} />
            {q.options.map((o) => {
              const show = picked !== null;
              const color = show && o === q.answer ? C.good : show && o === picked ? C.red : C.cardBorder;
              return (
                <Pressable key={o} onPress={() => choose(o)} style={({ pressed }) => [vs.opt, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}>
                  <T size={17}>{o}</T>
                </Pressable>
              );
            })}
            {picked !== null && (
              <>
                <Card style={{ alignItems: 'center', gap: 6 }}>
                  <PicturePop item={q.item} size={72} />
                  <T bold size={20}>{q.item.word}</T>
                  <T dim>{q.item.translation}</T>
                  {picked !== q.answer && q.item.example ? <T dim size={13} style={{ textAlign: 'center' }}>{q.item.example}</T> : null}
                </Card>
                {picked !== q.answer && <Button label="Keyingi →" onPress={pickNext} />}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
