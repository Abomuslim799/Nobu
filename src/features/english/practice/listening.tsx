/** Listening: gapni eshitib to'liq yozish, so'zma-so'z tekshiruv. */

import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { C } from '@/core/theme';
import { CORE_WORDS } from '@/features/english/data/core';
import { UNITS } from '@/features/english/data/units';
import { logSkill } from '@/features/english/skills';
import { say } from '@/features/english/speak';
import { Button, Card, T } from '@/core/ui/kit';
import { Pick, s } from '@/features/english/practice/kit';

// ── Listening: eshit → to'liq yoz ────────────────────────────────────────────
interface Line { id: string; part: string; text: string }
const MOVIE_LINES: Line[] = UNITS.flatMap((u) => [
  ...u.dictation.map((d, i) => ({ id: u.id, part: `d${i}`, text: d.text })),
  ...u.shadowing.map((t, i) => ({ id: u.id, part: `sh${i}`, text: t })),
]);
const CORE_LINES: Line[] = CORE_WORDS.filter((w) => w.example.split(' ').length >= 4)
  .map((w) => ({ id: w.id, part: 's', text: w.example }));
const SESSION = 10;
const words = (x: string) => x.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);

export function ListeningPractice() {
  const [lines, setLines] = useState<Line[] | null>(null);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [source, setSource] = useState('');

  const start = (pool: Line[], name: string) => {
    setLines([...pool].sort(() => Math.random() - 0.5).slice(0, SESSION));
    setI(0); setInput(''); setChecked(false); setScores([]); setMissed([]); setSource(name);
  };
  const line = lines?.[i];
  useEffect(() => { if (line) say(line.id, line.part, line.text); }, [line]);

  if (!lines) {
    return (
      <>
        <T dim>Gapni eshiting va TO'LIQ yozing (matnni ko'rmasdan). Har gap so'zma-so'z tekshiriladi. Sessiya — {SESSION} gap.</T>
        <Pick label="🎬 Movie gaplari" sub={`${MOVIE_LINES.length} ta gap · London ovozi (Ryan)`} onPress={() => start(MOVIE_LINES, 'Movie gaplari')} />
        <Pick label="📚 Core misollar" sub={`${CORE_LINES.length} ta qisqa gap · telefon ovozi`} onPress={() => start(CORE_LINES, 'Core misollar')} />
      </>
    );
  }

  if (!line) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
    return (
      <Card style={{ gap: 8 }}>
        <T size={24} bold>{avg}%</T>
        <T dim>{source} · {scores.length} ta gap</T>
        {missed.length > 0 && <T size={14}>Eshitilmagan so'zlar: {missed.join(', ')}</T>}
        <Button label="Yana bir sessiya" onPress={() => setLines(null)} />
      </Card>
    );
  }

  // Tekshiruv: asl gapdagi har bir so'z kiritilganda bormi
  const target = words(line.text);
  const got = words(input);
  const bag = [...got];
  const marks = target.map((w) => { const k = bag.indexOf(w); if (k >= 0) { bag.splice(k, 1); return true; } return false; });
  const pct = Math.round((marks.filter(Boolean).length / target.length) * 100);

  const check = () => {
    setChecked(true);
    setScores((x) => [...x, pct]);
    const miss = target.filter((_, k) => !marks[k]);
    setMissed((m) => [...m, ...miss.filter((w) => !m.includes(w))]);
  };
  const next = () => {
    const nextI = i + 1;
    setI(nextI); setInput(''); setChecked(false);
    if (nextI >= lines.length) {
      const all = [...scores];
      logSkill('listening', all.reduce((a, b) => a + b, 0) / Math.max(1, all.length), source, missed);
    }
  };

  return (
    <>
      <T dim>{i + 1}/{lines.length} · {source}</T>
      <Pressable onPress={() => say(line.id, line.part, line.text)} style={s.play}>
        <Text style={{ fontSize: 40 }}>🔊</Text>
      </Pressable>
      <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} multiline autoCapitalize="sentences" autoCorrect={false}
        placeholder="Eshitganingizni yozing..." placeholderTextColor={C.dim} value={input} onChangeText={setInput} editable={!checked} />
      {checked ? (
        <Card style={{ gap: 6 }}>
          <T bold color={pct >= 90 ? C.green : pct >= 60 ? C.text : C.red}>{pct}%</T>
          <Text style={{ fontSize: 17, lineHeight: 26 }}>
            {line.text.split(/\s+/).map((tok, k) => (
              <Text key={k} style={{ color: marks[k] === false ? C.red : C.green, fontWeight: marks[k] === false ? '700' : '400' }}>{tok} </Text>
            ))}
          </Text>
          <T dim size={13}>Qizil — eshitilmagan yoki noto'g'ri yozilgan so'zlar.</T>
          <Button label={i + 1 < lines.length ? 'Keyingi gap →' : 'Natija'} onPress={next} />
        </Card>
      ) : (
        <Button label="Tekshirish" disabled={!input.trim()} onPress={check} />
      )}
    </>
  );
}
