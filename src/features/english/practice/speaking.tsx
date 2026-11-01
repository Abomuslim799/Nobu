/** Speaking: mavzular bo'yicha jonli suhbat. */

import { router } from 'expo-router';

import { UNITS } from '@/features/english/data/units';
import { T } from '@/core/ui/kit';
import { Pick } from '@/features/english/practice/kit';

// ── Speaking ────────────────────────────────────────────────────────────────
const TOPICS = [
  'your job and your colleagues', 'running and preparing for a marathon', 'learning English and other languages',
  'chess and strategy games', 'technology, AI and programming', 'your city and travelling', 'money, saving and plans for the future',
  'books you are reading', 'a job interview (AI is the interviewer)', 'IELTS Speaking Part 2 and 3 practice',
];

export function SpeakingPractice() {
  const call = (topic: string, words = '') => router.push({ pathname: '/nobu/live', params: { topic, words } });
  return (
    <>
      <T dim>Mavzuni tanlang — Nobu bilan jonli ovozli suhbat (telefon qo'ng'irog'idek). Oxirida AI ball va xatolaringizni ko'rsatadi, natija statistikaga yoziladi.</T>
      {TOPICS.map((t) => <Pick key={t} label={`📞 ${t}`} onPress={() => call(t)} />)}
      <T bold>Filmlar haqida</T>
      {UNITS.map((u) => (
        <Pick key={u.id} label={`📞 ${u.emoji} ${u.source}`}
          onPress={() => call(`the film "${u.source}"`, [...u.vocab, ...u.collocations].map((w) => w.word).join(','))} />
      ))}
    </>
  );
}
