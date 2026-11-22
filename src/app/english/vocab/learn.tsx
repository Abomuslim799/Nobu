/**
 * english/vocab/learn.tsx — yangi so'zlar: 10 talik to'plam. Avval karta (so'z + rasm birga),
 * keyin shu 10 tasi bo'yicha tekshiruv (har so'zga 1 savol). Karta ko'rilgach so'z o'rganilgan (Hard).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bar, Button, Card, T } from '@/core/ui/kit';
import { s } from '@/features/english/practice/kit';
import { say, stopSpeaking } from '@/features/english/speak';
import { pickNew, type Item } from '@/features/english/vocab/base';
import { makeQuestion, type VQuestion } from '@/features/english/vocab/question';
import type { Kind, Status } from '@/features/english/vocab/srs';
import { summary, useVocab } from '@/features/english/vocab/store';
import { LearnCard, RevealCard } from '@/features/english/vocab/ui';

const BATCH = 10;

export default function Learn() {
  const insets = useSafeAreaInsets();
  const { kind: k } = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = k === 'colloc' ? 'colloc' : 'word';
  const { v, items, learn, setStatus } = useVocab();

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
          <Check key={round} batch={batch} onRate={setStatus} onDone={() => setPhase('done')} />
        )}
        {phase === 'done' && (
          <Card style={{ alignItems: 'center', gap: 10 }}>
            <T bold size={20}>✅ {batch?.length} ta yangi so'z o'rganildi</T>
            <T dim>Tanlagan statusingiz bo'yicha takrorda chiqadi (Hard — tez-tez).</T>
            {left > 0 && <Button label={`Yana ${Math.min(BATCH, left)} ta`} onPress={again} />}
            <Button kind="ghost" label="Orqaga" onPress={() => router.back()} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** To'plam tekshiruvi: har so'z bir marta, bosib ochish — statusni o'zingiz tanlaysiz ("Bilmayman" → Hard). */
function Check({ batch, onRate, onDone }: { batch: Item[]; onRate: (id: string, st: Status) => void; onDone: () => void }) {
  const [queue] = useState<VQuestion[]>(() => [...batch].sort(() => Math.random() - 0.5).map((w) => makeQuestion(w)));
  const [n, setN] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const q = queue[n];
  useEffect(() => stopSpeaking, [q]);

  const next = () => { setWaiting(false); if (n + 1 < queue.length) setN(n + 1); else onDone(); };
  if (!q) return null;
  return (
    <>
      <T dim size={13}>Tekshiruv {n + 1}/{queue.length} · eslang va oching</T>
      <RevealCard key={n} q={q} onRate={(st, unknown) => { onRate(q.item.id, st); if (unknown) setWaiting(true); else next(); }} />
      {waiting && <Button label="Keyingi →" onPress={next} />}
    </>
  );
}
