/**
 * english/vocab/review.tsx — cheksiz takror ("time killer"), bosib ochish:
 * ma'noni ko'rasiz → eslaysiz → ochasiz → Hard / Normal / Easy ni o'zingiz tanlaysiz. "Bilmayman" → Hard.
 * Navbat: eng yuqori balli so'z (Hard tez-tez, Easy kam).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { stopSpeaking } from '@/features/english/speak';
import { makeQuestion, type VQuestion } from '@/features/english/vocab/question';
import { REVIEW_MIN, STATUS_UI, decay, nextReadyIn, reviewOrder, type Kind, type Status } from '@/features/english/vocab/srs';
import { summary, useVocab } from '@/features/english/vocab/store';
import { RevealCard } from '@/features/english/vocab/ui';

export default function Review() {
  const insets = useSafeAreaInsets();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = k === 'colloc' ? 'colloc' : 'word';
  const { v, items, answer } = useVocab();

  const pool = useMemo(() => items.filter((w) => w.kind === kind), [items, kind]);
  const byId = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);
  const [q, setQ] = useState<VQuestion | null>(null);
  const [empty, setEmpty] = useState<number | null>(null);
  const [before, setBefore] = useState<Status | null>(null);
  const [waiting, setWaiting] = useState(false);   // "Bilmayman" — so'zni ko'rib, "Keyingi" bosiladi
  const [session, setSession] = useState({ n: 0, hard: 0 });
  const [qn, setQn] = useState(0);
  const lastId = useRef<string | undefined>(undefined);
  const pending = useRef(false);

  const pickNext = () => {
    if (!v) return;
    const ids = pool.map((w) => w.id);
    const [id] = reviewOrder(v.states, ids, Date.now(), lastId.current);
    setWaiting(false);
    if (!id) { setQ(null); setEmpty(nextReadyIn(v.states, ids)); return; }
    setQ(makeQuestion(byId.get(id)!));
    setQn((x) => x + 1);
    setBefore(decay(v.states[id]).st);
    setEmpty(null);
  };

  // Birinchi savol — ma'lumot yuklangach; status tanlangach — saqlangan holat bilan keyingisi.
  const started = useRef(false);
  useEffect(() => {
    if (!v) return;
    if (!started.current) { started.current = true; pickNext(); return; }
    if (pending.current) { pending.current = false; pickNext(); }
  });
  useEffect(() => stopSpeaking, [q]);

  const rate = (st: Status, unknown: boolean) => {
    if (!q) return;
    lastId.current = q.item.id;
    answer(q.item.id, kind, st);
    setSession((x) => ({ n: x.n + 1, hard: x.hard + (st === 'hard' ? 1 : 0) }));
    if (unknown) setWaiting(true); else pending.current = true;
  };

  const sum = v ? summary(v, items, kind) : null;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <T bold style={{ flex: 1 }}>🔁 Takror · {session.n} ta{session.hard ? ` · ${session.hard} Hard` : ''}</T>
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
            {before && <T size={13} bold color={STATUS_UI[before].color}>Hozirgi status: {STATUS_UI[before].label}</T>}
            <RevealCard key={qn} q={q} onRate={rate} />
            {waiting && <Button label="Keyingi →" onPress={pickNext} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
