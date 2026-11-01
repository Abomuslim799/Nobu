/** Writing: erkin mavzular, AI tekshiruvi. */

import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { C } from '@/core/theme';
import { UNITS } from '@/features/english/data/units';
import { writeCheck, type WriteResult } from '@/features/english/ai';
import { logSkill } from '@/features/english/skills';
import { Button, Card, T } from '@/core/ui/kit';
import { Pick, s } from '@/features/english/practice/kit';

// ── Writing ─────────────────────────────────────────────────────────────────
const FREE_TASKS = [
  'Describe your typical working day and what you would change about it.',
  'Should people work from home or from the office? Give your opinion with examples.',
  'Write an email to a friend about a film you watched recently and recommend (or not) it.',
  'What is the best way to learn a foreign language as an adult? Explain your method.',
  'Describe a difficult challenge in sport or life and how you dealt with it.',
];

export function WritingPractice() {
  const [task, setTask] = useState<{ text: string; level: string; words: string[] } | null>(null);
  const [text, setText] = useState('');
  const [review, setReview] = useState<WriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!task) {
    return (
      <>
        <T dim>Topshiriqni tanlang. Yozib bo'lgach AI daraja, xatolar va yaxshiroq variantni ko'rsatadi.</T>
        <T bold>Erkin mavzular</T>
        {FREE_TASKS.map((t) => <Pick key={t} label={t} onPress={() => setTask({ text: t, level: 'B2', words: [] })} />)}
        <T bold>Movie topshiriqlari</T>
        {UNITS.map((u) => (
          <Pick key={u.id} label={`${u.emoji} ${u.source}`} sub={u.writing.task}
            onPress={() => setTask({ text: u.writing.task, level: u.level, words: [...u.vocab, ...u.collocations].map((w) => w.word) })} />
        ))}
      </>
    );
  }
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  const check = async () => {
    setBusy(true); setErr('');
    try {
      const r = await writeCheck(task.text, text, task.level, task.words);
      setReview(r);
      logSkill('writing', r.score, task.text.slice(0, 40), r.corrections.map((c) => `${c.wrong} → ${c.right}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Card style={{ borderColor: C.green }}><T>{task.text}</T></Card>
      <TextInput style={[s.input, { minHeight: 240, textAlignVertical: 'top' }]} multiline
        placeholder="Write in English..." placeholderTextColor={C.dim} value={text} onChangeText={setText} />
      <T dim>{count} so'z (tavsiya: 120–200)</T>
      <Button label={busy ? '⏳ Tekshirilmoqda...' : '🤖 AI tekshiruvi'} disabled={busy || count < 40} onPress={check} />
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
      <Button kind="ghost" label="← Boshqa topshiriq" onPress={() => { setTask(null); setText(''); setReview(null); }} />
    </>
  );
}
