/** Miya o'yini: LogicAI. */

import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { C } from '@/core/theme';
import { logicSet } from '@/features/brain/ai';
import { QuizRunner } from '@/core/ui/quiz-runner';
import { Button, T } from '@/core/ui/kit';
import { type GameProps } from '@/features/brain/games/kit';

// ── 🧩 Mantiqiy masalalar (AI yaratadi) ─────────────────────────────────────
export function LogicAI({ level, onDone }: GameProps) {
  const [items, setItems] = useState<{ q: string; options: string[]; answer: string; why: string }[] | null>(null);
  const [err, setErr] = useState('');
  const [sec, setSec] = useState(0);
  const [tryN, setTryN] = useState(0);
  useEffect(() => {
    let alive = true;
    setErr(''); setItems(null); setSec(0);
    const tick = setInterval(() => setSec((x) => x + 1), 1000);
    logicSet(level)
      .then((xs) => { if (!alive) return; if (!xs.length) throw new Error("AI bo'sh javob qaytardi"); setItems(xs); })
      .catch((e) => alive && setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => clearInterval(tick));
    return () => { alive = false; clearInterval(tick); };
  }, [level, tryN]);
  if (err) return (
    <View style={{ gap: 12 }}>
      <T color={C.red}>{err}</T>
      <Button label="🔄 Qayta urinish" onPress={() => setTryN((x) => x + 1)} />
    </View>
  );
  if (!items) return <T dim>⏳ AI masalalar tayyorlamoqda... {sec}s (odatda 15–40 soniya)</T>;
  return <QuizRunner items={items} onFinish={(c) => onDone((c / items.length) * 100, [])} finishLabel="Natija" />;
}
