/** Writing: matn yozish, filmdagi so'zlar soni, AI tekshiruvi. */

import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { writeCheck, type WriteResult } from '@/features/english/ai';
import { logSkill } from '@/features/english/skills';
import { Button, Card, T } from '@/core/ui/kit';
import { KEYS } from '@/core/storage';
import { s } from '@/features/english/unit/styles';

// ── 5. Writing ──────────────────────────────────────────────────────────────
/** Matnni yozish: so'z soni va movie so'zlaridan nechtasi ishlatilgani sanaladi. Matn telefonda saqlanadi. */
export const MIN_MOVIE_WORDS = 6;
export function Writing({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const key = KEYS.writing(unit.id);
  const [text, setText] = useState('');
  useEffect(() => { AsyncStorage.getItem(key).then((v) => v && setText(v)).catch(() => {}); }, [key]);
  const change = (t: string) => { setText(t); AsyncStorage.setItem(key, t).catch(() => {}); };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lower = text.toLowerCase();
  // So'z "ildizi" bo'yicha qidiramiz: decide → decided, decision ham sanaladi
  const used = [...unit.vocab, ...unit.collocations].filter((w) => {
    const core = w.word.replace(/^to /, '').replace(/\s*\(.*?\)/, '').split(/\s+/).filter((p) => p.length > 2 && !['sb', 'sth'].includes(p));
    return core.length > 0 && core.every((p) => lower.includes(p.slice(0, Math.max(3, p.length - 2)).toLowerCase()));
  });
  const ready = words >= unit.writing.minWords && used.length >= MIN_MOVIE_WORDS;
  const [review, setReview] = useState<WriteResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState('');
  const check = async () => {
    setChecking(true); setErr('');
    try {
      const r = await writeCheck(unit.writing.task, text, unit.level, [...unit.vocab, ...unit.collocations].map((w) => w.word));
      setReview(r);
      logSkill('writing', r.score, unit.source, r.corrections.map((c) => `${c.wrong} → ${c.right}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Card style={{ gap: 8, borderColor: C.green }}>
        <T bold>✍️ Topshiriq</T>
        <T>{unit.writing.task}</T>
        <T dim size={13}>Kamida {unit.writing.minWords} so'z va shu movie'dan {MIN_MOVIE_WORDS} ta so'z/collocation.</T>
      </Card>
      <TextInput style={[s.input, { minHeight: 220, textAlignVertical: 'top' }]} multiline autoCapitalize="sentences"
        placeholder="Write in English..." placeholderTextColor={C.dim} value={text} onChangeText={change} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <T color={words >= unit.writing.minWords ? C.green : C.dim}>{words}/{unit.writing.minWords} so'z</T>
        <T color={used.length >= MIN_MOVIE_WORDS ? C.green : C.dim}>{used.length}/{MIN_MOVIE_WORDS} movie so'zi</T>
      </View>
      {used.length > 0 && <T dim size={13}>Ishlatilgan: {used.map((w) => w.word).join(', ')}</T>}
      <Button kind="ghost" label={checking ? '⏳ Tekshirilmoqda...' : '🤖 AI tekshiruvi'} disabled={!ready || checking} onPress={check} />
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {review && (
        <Card style={{ gap: 6 }}>
          <T bold>Daraja: {review.level} · {review.score}/100</T>
          <T size={14}>💡 {review.feedback_uz}</T>
          {review.corrections.map((c, k) => (
            <T key={k} size={14}>✏️ <Text style={{ color: C.red }}>{c.wrong}</Text> → <Text style={{ color: C.green }}>{c.right}</Text> · {c.why_uz}</T>
          ))}
          <T bold size={14}>Yaxshiroq variant:</T>
          <T dim size={14}>{review.better}</T>
        </Card>
      )}
      <Button label="Topshirish → speaking" disabled={!ready} onPress={() => onDone(review ? Math.round(review.score / 10) : used.length)} />
    </>
  );
}
