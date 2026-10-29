/**
 * practice/[skill].tsx — alohida mashq bo'limlari (movie'ga bog'lanmagan):
 *   grammar   — mavzu tanlash → darsdagi mashqlar yoki AI yaratgan yangi 10 ta
 *   listening — gapni eshitib to'liq yozish, so'zma-so'z tekshiruv
 *   writing   — topshiriq tanlash → yozish → AI tekshiruvi
 *   speaking  — mavzu tanlash → AI bilan ovozli suhbat
 *   report    — barcha ko'nikmalar statistikasi + AI tahlil (kuchli/zaif tomonlar, reja)
 * Har bir natija lib/skills.ts jurnaliga yoziladi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { CORE_WORDS } from '@/data/core';
import { UNITS, type Unit } from '@/data/units';
import { grammarSet, skillsReport, writeCheck, type GrammarItem, type SkillsReport, type WriteResult } from '@/lib/ai';
import { getLog, logSkill, SKILLS, stats, summarize, type SkillEntry } from '@/lib/skills';
import { say, stopSpeaking } from '@/lib/speak';
import { QuizRunner, Rich } from '@/ui/choice';
import { Conversation, useMic } from '@/ui/conversation';
import { Bar, Button, Card, T } from '@/ui/kit';
import { RateSwitch } from '@/ui/sound';

const TITLES: Record<string, string> = {
  grammar: '🧩 Grammar', listening: '🎧 Listening', writing: '✍️ Writing', speaking: '🗣 Speaking', report: '📊 Statistika va AI tahlil',
};

export default function Practice() {
  const insets = useSafeAreaInsets();
  const { skill = 'report' } = useLocalSearchParams<{ skill: string }>();
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => { stopSpeaking(); router.back(); }} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold size={18} style={{ flex: 1 }}>{TITLES[skill] ?? skill}</T>
        {skill === 'listening' && <RateSwitch />}
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {skill === 'grammar' && <GrammarPractice />}
        {skill === 'listening' && <ListeningPractice />}
        {skill === 'writing' && <WritingPractice />}
        {skill === 'speaking' && <SpeakingPractice />}
        {skill === 'report' && <Report />}
      </ScrollView>
    </View>
  );
}

/** Tanlov ro'yxati uchun oddiy tugma-qator. */
function Pick({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pick, pressed && { opacity: 0.7 }]}>
      <T bold>{label}</T>
      {sub ? <T dim size={13}>{sub}</T> : null}
    </Pressable>
  );
}

// ── Grammar ─────────────────────────────────────────────────────────────────
function GrammarPractice() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [items, setItems] = useState<GrammarItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!unit) {
    return (
      <>
        <T dim>Mavzuni tanlang. Qoida → darsdagi mashqlar → AI yaratgan yangi mashqlar (cheksiz).</T>
        {UNITS.map((u) => <Pick key={u.id} label={u.grammar.title} sub={`${u.emoji} ${u.source} · ${u.level}`} onPress={() => setUnit(u)} />)}
      </>
    );
  }
  const g = unit.grammar;
  const done = (correct: number) => {
    const n = items?.length ?? 1;
    logSkill('grammar', (correct / n) * 100, g.title);   // QuizRunner xatolarni ekranda o'zi ko'rsatadi
    setItems(null);
  };
  const aiSet = async () => {
    setBusy(true); setErr('');
    try {
      setItems(await grammarSet(g.title, unit.level, g.exercises.map((e) => e.q)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (items) {
    return (
      <>
        <T bold size={17}>{g.title}</T>
        <QuizRunner items={items} onFinish={done} finishLabel="Saqlash" />
        <Button kind="ghost" label="← Mavzuga qaytish" onPress={() => setItems(null)} />
      </>
    );
  }
  return (
    <>
      <T bold size={19}>{g.title}</T>
      {g.explain.map((e, i) => <Card key={i}><Rich text={e} /></Card>)}
      <Button label={`Darsdagi mashqlar (${g.exercises.length})`} onPress={() => setItems(g.exercises)} />
      <Button kind="ghost" label={busy ? '⏳ AI mashq tayyorlamoqda...' : '🤖 Yangi 10 ta mashq (AI)'} disabled={busy} onPress={aiSet} />
      {!!err && <T color={C.red} size={13}>{err}</T>}
      <Button kind="ghost" label="← Boshqa mavzu" onPress={() => setUnit(null)} />
    </>
  );
}

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

function ListeningPractice() {
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

// ── Writing ─────────────────────────────────────────────────────────────────
const FREE_TASKS = [
  'Describe your typical working day and what you would change about it.',
  'Should people work from home or from the office? Give your opinion with examples.',
  'Write an email to a friend about a film you watched recently and recommend (or not) it.',
  'What is the best way to learn a foreign language as an adult? Explain your method.',
  'Describe a difficult challenge in sport or life and how you dealt with it.',
];

function WritingPractice() {
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

// ── Speaking ────────────────────────────────────────────────────────────────
const TOPICS = [
  'your job and your colleagues', 'running and preparing for a marathon', 'learning English and other languages',
  'chess and strategy games', 'technology, AI and programming', 'your city and travelling', 'money, saving and plans for the future',
  'books you are reading', 'a job interview (AI is the interviewer)', 'IELTS Speaking Part 2 and 3 practice',
];

function SpeakingPractice() {
  const mic = useMic();
  const [topic, setTopic] = useState<string | null>(null);
  if (!topic) {
    return (
      <>
        <T dim>Mavzuni tanlang va AI bilan ovozli suhbat qiling. U javob beradi, savol beradi va xatolaringizni tuzatadi. Oxirida 🏁 bilan natijani saqlang.</T>
        {TOPICS.map((t) => <Pick key={t} label={t} onPress={() => setTopic(t)} />)}
        <T bold>Filmlar haqida</T>
        {UNITS.map((u) => <Pick key={u.id} label={`${u.emoji} ${u.source}`} onPress={() => setTopic(`the film "${u.source}"`)} />)}
      </>
    );
  }
  return (
    <>
      <Conversation topic={topic} title={`🗣 ${topic}`} words={[]} mic={mic} />
      <Button kind="ghost" label="← Boshqa mavzu" onPress={() => { stopSpeaking(); setTopic(null); }} />
    </>
  );
}

// ── Statistika va AI tahlil ─────────────────────────────────────────────────
function Report() {
  const [log, setLog] = useState<SkillEntry[] | null>(null);
  const [ai, setAi] = useState<SkillsReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { getLog().then(setLog); }, []);
  const st = useMemo(() => (log ? stats(log) : []), [log]);

  if (!log) return <T dim>Yuklanmoqda...</T>;
  const analyse = async () => {
    setBusy(true); setErr('');
    try {
      setAi(await skillsReport(summarize(log)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const topMistakes = (() => {
    const c: Record<string, number> = {};
    log.slice(-150).forEach((e) => e.mistakes.forEach((m) => { c[m] = (c[m] ?? 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  return (
    <>
      <T dim>{log.length} ta mashq natijasi saqlangan. Ball — oxirgi 5 ta mashq o'rtachasi.</T>
      {st.map((x) => {
        const meta = SKILLS.find((k) => k.id === x.skill)!;
        return (
          <Card key={x.skill} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T bold>{meta.icon} {meta.title}</T>
              <T bold color={x.count ? (x.recent >= 80 ? C.green : x.recent >= 60 ? C.text : C.red) : C.dim}>
                {x.count ? `${x.recent}%` : "ma'lumot yo'q"}
              </T>
            </View>
            <Bar value={x.recent / 100} />
            <T dim size={13}>
              {x.count} ta mashq · umumiy o'rtacha {x.avg}%{x.trend ? ` · ${x.trend > 0 ? '▲' : '▼'} ${Math.abs(x.trend)}` : ''}
            </T>
          </Card>
        );
      })}
      {topMistakes.length > 0 && (
        <Card style={{ gap: 4 }}>
          <T bold>Ko'p takrorlanayotgan xatolar</T>
          {topMistakes.map(([m, n]) => <T key={m} size={14}>• {m} <Text style={{ color: C.dim }}>×{n}</Text></T>)}
        </Card>
      )}
      <Button label={busy ? '⏳ AI tahlil qilmoqda...' : '🤖 AI to\'liq tahlil'} disabled={busy || log.length < 3} onPress={analyse} />
      {log.length < 3 && <T dim size={13}>AI tahlil uchun kamida 3 ta mashq natijasi kerak.</T>}
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {ai && (
        <>
          <Card style={{ gap: 6, borderColor: C.green }}>
            <T bold size={18}>Taxminiy daraja: {ai.level}</T>
            <T size={14}>{ai.summary_uz}</T>
            {ai.skills.map((k) => <T key={k.skill} size={14}>• {k.skill}: <Text style={{ fontWeight: '700', color: C.text }}>{k.level}</Text> — {k.comment_uz}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold color={C.green}>💪 Kuchli tomonlar</T>
            {ai.strengths_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold color={C.red}>⚠️ Zaif tomonlar</T>
            {ai.weaknesses_uz.map((x, k) => <T key={k} size={14}>• {x}</T>)}
          </Card>
          <Card style={{ gap: 4 }}>
            <T bold>🗓 Keyingi 2 hafta rejasi</T>
            {ai.plan_uz.map((x, k) => <T key={k} size={14}>{k + 1}. {x}</T>)}
          </Card>
        </>
      )}
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  pick: { padding: 14, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, gap: 2 },
  play: { alignSelf: 'center', width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenSoft },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
