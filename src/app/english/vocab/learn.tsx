/**
 * english/vocab/learn.tsx — yangi so'zlar: 10 talik to'plam. Avval karta (so'z + rasm birga),
 * keyin shu 10 tasi bo'yicha tekshiruv (har so'zga 1 savol). Karta ko'rilgach so'z o'rganilgan (Hard).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { say, stopSpeaking } from '@/features/english/speak';
import { pickNew, type Item } from '@/features/english/vocab/base';
import { makeQuestion, QTYPE_LABEL, type VQuestion } from '@/features/english/vocab/question';
import type { Kind } from '@/features/english/vocab/srs';
import { summary, useVocab } from '@/features/english/vocab/store';
import { LearnCard, PicturePop, Prompt, s as vs } from '@/features/english/vocab/ui';

const BATCH = 10;

export default function Learn() {
  const insets = useSafeAreaInsets();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = k === 'colloc' ? 'colloc' : 'word';
  const { v, items, learn } = useVocab();

  const [batch, setBatch] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'cards' | 'check' | 'done'>('cards');
  const [round, setRound] = useState(0);

  const left = v ? summary(v, items, kind).plan.left : 0;
  useEffect(() => {
    if (!v || batch) return;
    const ids = new Set(Object.keys(v.states));
    setBatch(pickNew(items, kind, ids, v.enabled, Math.min(BATCH, left)));
  }, [v, batch, items, kind, left]);

  useEffect(() => {
    const w = batch?.[i];
    if (phase === 'cards' && w) say(w.id, 'w', w.word);
    return stopSpeaking;
  }, [batch, i, phase]);

  const next = () => {
    const w = batch?.[i];
    if (!w || !batch) return;
    learn(w.id);
    if (i + 1 < batch.length) setI(i + 1); else setPhase('check');
  };

  const again = () => { setBatch(null); setI(0); setPhase('cards'); setRound((r) => r + 1); };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}><Bar value={batch?.length ? (phase === 'cards' ? i / batch.length : 1) : 0} /></View>
        <T dim>{phase === 'cards' && batch ? `${i + 1}/${batch.length}` : phase === 'check' ? 'Tekshiruv' : ''}</T>
      </View>
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]}>
        {batch && batch.length === 0 && (
          <Card style={{ alignItems: 'center', gap: 8 }}>
            <T bold size={20}>✅ Bugungi yangi so'zlar tugadi</T>
            <Button label="Orqaga" onPress={() => router.back()} />
          </Card>
        )}
        {batch && batch.length > 0 && phase === 'cards' && batch[i] && (
          <>
            <LearnCard key={batch[i].id} item={batch[i]} />
            <Button label={i + 1 < batch.length ? 'Keyingi →' : 'Tekshiruvga →'} onPress={next} />
          </>
        )}
        {batch && phase === 'check' && (
          <Check key={round} batch={batch} pool={items.filter((w) => w.kind === kind)} onDone={() => setPhase('done')} />
        )}
        {phase === 'done' && (
          <Card style={{ alignItems: 'center', gap: 10 }}>
            <T bold size={20}>✅ {batch?.length} ta yangi so'z o'rganildi</T>
            <T dim>Ular Hard holatida — takrorda tez-tez chiqadi.</T>
            {left > 0 && <Button label={`Yana ${Math.min(BATCH, left)} ta`} onPress={again} />}
            <Button kind="ghost" label="Orqaga" onPress={() => router.back()} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** To'plam tekshiruvi: har so'zga 1 savol; xato qilinganlar oxirida bir marta qaytadi. */
function Check({ batch, pool, onDone }: { batch: Item[]; pool: Item[]; onDone: () => void }) {
  const [queue, setQueue] = useState<VQuestion[]>(() => batch.map((w) => makeQuestion(w, pool)).sort(() => Math.random() - 0.5));
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [retried] = useState(() => new Set<string>());
  const q = queue[n];

  useEffect(() => {
    if (q?.type === 'audio') say(q.item.id, 'w', q.item.word);
    return stopSpeaking;
  }, [q]);

  const choose = (o: string) => {
    if (picked || !q) return;
    setPicked(o);
    if (o !== q.answer && !retried.has(q.item.id)) { retried.add(q.item.id); setQueue((x) => [...x, makeQuestion(q.item, pool)]); }
  };
  const next = () => { setPicked(null); if (n + 1 < queue.length) setN(n + 1); else onDone(); };
  const total = useMemo(() => queue.length, [queue]);

  if (!q) return null;
  return (
    <>
      <T dim size={13}>{n + 1}/{total} · {QTYPE_LABEL[q.type]}</T>
      <Prompt q={q} />
      {q.options.map((o) => {
        const show = picked !== null;
        const color = show && o === q.answer ? C.good : show && o === picked ? C.red : C.cardBorder;
        return (
          <Pressable key={o} onPress={() => choose(o)} style={[vs.opt, { borderColor: color }]}>
            <T size={17}>{o}</T>
          </Pressable>
        );
      })}
      {picked !== null && (
        <>
          <Card style={{ alignItems: 'center', gap: 6 }}>
            <PicturePop item={q.item} size={64} />
            <T bold size={18}>{q.item.word}</T>
            <T dim>{q.item.translation}</T>
          </Card>
          <Button label="Keyingi →" onPress={next} />
        </>
      )}
    </>
  );
}
