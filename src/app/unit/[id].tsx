/**
 * unit/[id].tsx — bitta Movie 7 qadamda: Vocab → Grammar → Reading → Listening → Writing →
 * Speaking → Test. Har qadam tugaganda belgilanadi va kunlik maqsadga qo'shiladi.
 * Kontent: src/data/units/*.json. Ovozlar: London (Ryan), GitHub'da yasaladi.
 */

import {
  RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { STEPS, UNITS, type StepId, type Unit } from '@/data/units';
import { useProgress } from '@/lib/progress';
import { say, stopSpeaking } from '@/lib/speak';
import { QuizRunner, Rich } from '@/ui/choice';
import { Button, Card, T } from '@/ui/kit';
import { RateSwitch, SoundButton } from '@/ui/sound';
import { Stress } from '@/ui/stress';

export default function UnitScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = UNITS.find((u) => u.id === id);
  const { data, completeUnitStep } = useProgress();
  const done = data.unitSteps[id] ?? [];
  const [step, setStep] = useState<StepId>(() => STEPS.find((x) => !done.includes(x.id))?.id ?? 'vocab');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  if (!unit) return <View style={s.root}><T>Movie topilmadi</T></View>;

  const idx = STEPS.findIndex((x) => x.id === step);
  const finish = (score = 0) => {
    completeUnitStep(unit.id, step, score);
    stopSpeaking();
    const next = STEPS[idx + 1];
    if (next) {
      setStep(next.id);
      scroll.current?.scrollTo({ y: 0, animated: false });
    } else router.back();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <T bold style={{ flex: 1 }} >{unit.emoji} {unit.source}</T>
        <RateSwitch />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={s.steps}>
        {STEPS.map((x) => (
          <Pressable key={x.id} onPress={() => { stopSpeaking(); setStep(x.id); }}
            style={[s.stepChip, step === x.id && { backgroundColor: C.green }]}>
            <Text style={[s.stepText, step === x.id && { color: C.bg }]}>
              {done.includes(x.id) ? '✓ ' : ''}{x.icon} {x.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView ref={scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {step === 'vocab' && <Vocab unit={unit} onDone={() => finish()} />}
        {step === 'grammar' && <Grammar unit={unit} onDone={finish} />}
        {step === 'read' && <Reading unit={unit} onDone={finish} />}
        {step === 'listen' && <Listening unit={unit} onDone={finish} />}
        {step === 'write' && <Writing unit={unit} onDone={finish} />}
        {step === 'speak' && <Speaking unit={unit} onDone={() => finish()} />}
        {step === 'test' && <TestStep unit={unit} onDone={() => finish()} />}
      </ScrollView>
    </View>
  );
}

// ── Kirish kartasi (Vocab tepasida) ─────────────────────────────────────────
function Hook({ unit }: { unit: Unit }) {
  return (
    <>
      <Card style={{ gap: 12, borderColor: C.green }}>
        <Text style={s.quote}>“{unit.hook.quote}”</Text>
        <T dim>— {unit.hook.who}, {unit.source}</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <SoundButton id={unit.id} part="q" text={unit.hook.quote} label="Eshitish" />
          <Pressable style={s.ghostBtn} onPress={() => Linking.openURL(unit.hook.link)}>
            <Text style={{ color: C.text, fontWeight: '600' }}>▶ Sahnani YouTube'da</Text>
          </Pressable>
        </View>
      </Card>
      <Card><Rich text={unit.hook.context} /></Card>
      <T dim>Daraja: {unit.level} · Reja: so'zlar → grammatika → matn → tinglash → yozish → gapirish → test</T>
    </>
  );
}

// ── 2. Reading ──────────────────────────────────────────────────────────────
function Reading({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const [quiz, setQuiz] = useState(false);
  const stems = [...unit.vocab, ...unit.collocations].map((w) => w.word.replace(/^to /, '').split(' ')[0].toLowerCase());

  if (quiz) {
    return (
      <>
        <T bold size={17}>Tushundingizmi?</T>
        <QuizRunner items={unit.questions} onFinish={onDone} finishLabel="Keyingisi: listening →" />
        <Button kind="ghost" label="← Matnga qaytish" onPress={() => setQuiz(false)} />
      </>
    );
  }
  return (
    <>
      <T dim>Matnni o'qing. Yashil so'zlar — Vocab qadamida o'rgangan so'zlaringiz. Har xatboshini eshitish mumkin.</T>
      {unit.reading.map((p, i) => (
        <Card key={i} style={{ gap: 8 }}>
          <Text style={s.para}>
            {p.split(/(\s+)/).map((tok, j) => {
              const bare = tok.toLowerCase().replace(/[^a-z']/g, '');
              const hit = bare.length > 2 && stems.some((st) => bare.startsWith(st.slice(0, Math.max(4, st.length - 2))));
              return <Text key={j} style={hit ? { color: C.green, fontWeight: '700' } : undefined}>{tok}</Text>;
            })}
          </Text>
          <View style={{ alignSelf: 'flex-start' }}><SoundButton id={unit.id} part={`p${i}`} text={p} label="Eshitish" /></View>
        </Card>
      ))}
      <Button label={`O'qib bo'ldim → ${unit.questions.length} ta savol`} onPress={() => setQuiz(true)} />
    </>
  );
}

// ── 3. So'zlar ──────────────────────────────────────────────────────────────
function Vocab({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const row = (w: Unit['vocab'][number]) => (
    <Card key={w.id} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 30 }}>{w.emoji}</Text>
        <View style={{ flex: 1 }}>
          <T size={19} bold>{w.word}</T>
          <T color={C.green}>{w.translation}</T>
        </View>
      </View>
      {w.ipa ? <Stress ipa={w.ipa} /> : null}
      <T dim style={{ fontStyle: 'italic' }}>“{w.example}”</T>
      {w.note ? <T dim size={13}>💡 {w.note}</T> : null}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <SoundButton id={w.id} part="w" text={w.word} label="So'z" />
        <SoundButton id={w.id} part="s" text={w.example} label="Gap" />
      </View>
    </Card>
  );
  return (
    <>
      <Hook unit={unit} />
      <T bold size={18}>{unit.vocab.length} ta so'z</T>
      {unit.vocab.map(row)}
      <T bold size={18}>{unit.collocations.length} ta collocation — birga ishlatiladigan so'zlar</T>
      <T dim>Ingliz tilida so'zlar "juft" yuradi: make a decision, lekin do a decision emas. Ularni yaxlit yodlang.</T>
      {unit.collocations.map(row)}
      <Button kind="ghost" label="🎴 Kartochkada mashq" onPress={() => router.push(`/cards?deck=${unit.id}`)} />
      <Button label="Yodladim → grammatika" onPress={onDone} />
    </>
  );
}

// ── 4. Grammatika ───────────────────────────────────────────────────────────
function Grammar({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const g = unit.grammar;
  const [quiz, setQuiz] = useState(false);
  if (quiz) {
    return (
      <>
        <T bold size={17}>Mashq · {g.title}</T>
        <QuizRunner items={g.exercises} onFinish={onDone} finishLabel="Keyingisi: reading →" />
        <Button kind="ghost" label="← Qoidani qayta o'qish" onPress={() => setQuiz(false)} />
      </>
    );
  }
  return (
    <>
      <T bold size={19}>{g.title}</T>
      {g.explain.map((e, i) => <Card key={i}><Rich text={e} /></Card>)}
      <Button label={`Tushundim → ${g.exercises.length} ta mashq`} onPress={() => setQuiz(true)} />
    </>
  );
}

// ── 5. Listening — diktant ──────────────────────────────────────────────────
function Listening({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const [input, setInput] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const norm = (x: string) => x.trim().toLowerCase().replace(/[^a-z']/g, '');
  const correct = unit.dictation.filter((d, i) => norm(input[i] ?? '') === norm(d.gap)).length;
  return (
    <>
      <T dim>Gapni eshiting (kerak bo'lsa 0.5× tezlikda) va tushib qolgan so'zni yozing. Matnga qaramang!</T>
      {unit.dictation.map((d, i) => {
        const ok = norm(input[i] ?? '') === norm(d.gap);
        return (
          <Card key={i} style={{ gap: 8 }}>
            <View style={{ alignSelf: 'flex-start' }}><SoundButton id={unit.id} part={`d${i}`} text={d.text} label={`${i + 1}-gap`} /></View>
            <T>{d.text.replace(new RegExp(`\\b${d.gap}\\b`), '_____')}</T>
            <TextInput style={[s.input, checked && { borderColor: ok ? C.green : C.red }]} autoCapitalize="none"
              autoCorrect={false} placeholder="so'z" placeholderTextColor={C.dim} value={input[i] ?? ''}
              onChangeText={(t) => setInput((x) => ({ ...x, [i]: t }))} />
            {checked && !ok && <T color={C.red}>To'g'ri: {d.gap}</T>}
          </Card>
        );
      })}
      {checked ? (
        <>
          <T bold>{correct}/{unit.dictation.length} to'g'ri</T>
          <Button label="Keyingisi: writing →" onPress={() => onDone(correct)} />
        </>
      ) : (
        <Button label="Tekshirish" onPress={() => setChecked(true)} />
      )}
    </>
  );
}

// ── 5. Writing ──────────────────────────────────────────────────────────────
/** Matnni yozish: so'z soni va movie so'zlaridan nechtasi ishlatilgani sanaladi. Matn telefonda saqlanadi. */
const MIN_MOVIE_WORDS = 6;
function Writing({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const key = `nobu.writing.${unit.id}`;
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
      <Button label="Topshirish → speaking" disabled={!ready} onPress={() => onDone(used.length)} />
    </>
  );
}

// ── 6. Speaking — shadowing ─────────────────────────────────────────────────
function Speaking({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState<number | null>(null);
  const [mine, setMine] = useState<Record<number, string>>({});

  const start = async (i: number) => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return Alert.alert('Mikrofon', 'Sozlamalar → Expo Go → Mikrofon ruxsatini yoqing.');
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(i);
  };
  const stop = async () => {
    await recorder.stop();
    // Yozib bo'lgach — ovoz yana karnaydan chiqsin (iOS yozish rejimida qulog'i yonidagi dinamikka o'tadi).
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (recording !== null && recorder.uri) setMine((m) => ({ ...m, [recording]: recorder.uri! }));
    setRecording(null);
  };
  const playMine = (uri: string) => createAudioPlayer(uri).play();

  return (
    <>
      <Card style={{ gap: 6 }}>
        <T bold>Shadowing — "soya" usuli</T>
        <T dim size={14}>1) Asl ovozni eshiting. 2) 🎙 bosib xuddi shunday — urg'u va ohang bilan — takrorlang. 3) O'zingiznikini eshitib solishtiring. Har gapni 3 marta.</T>
      </Card>
      {unit.shadowing.map((line, i) => (
        <Card key={i} style={{ gap: 10 }}>
          <Text style={s.para}>{line}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <SoundButton id={unit.id} part={`sh${i}`} text={line} label="Asl" />
            {recording === i ? (
              <Pressable style={[s.ghostBtn, { borderColor: C.red }]} onPress={stop}>
                <Text style={{ color: C.red, fontWeight: '700' }}>⏹ To'xtatish</Text>
              </Pressable>
            ) : (
              <Pressable style={s.ghostBtn} disabled={recording !== null} onPress={() => start(i)}>
                <Text style={{ color: C.text, fontWeight: '600' }}>🎙 Yozish</Text>
              </Pressable>
            )}
            {mine[i] && (
              <Pressable style={s.ghostBtn} onPress={() => playMine(mine[i])}>
                <Text style={{ color: C.text, fontWeight: '600' }}>▶ Mening ovozim</Text>
              </Pressable>
            )}
          </View>
        </Card>
      ))}
      <Button label="Keyingisi: test →" onPress={onDone} />
    </>
  );
}

// ── 7. Test ─────────────────────────────────────────────────────────────────
function TestStep({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  return (
    <>
      <Card style={{ gap: 6 }}>
        <T bold>Yakuniy test — 3 bosqich</T>
        <T dim size={14}>Shu movie'ning {unit.vocab.length + unit.collocations.length} so'zi: tarjima ↔ so'z, ovoz → so'z, gapdagi bo'sh joy. Xato topilgan so'zlar kartochkalarda tezroq qaytadi.</T>
      </Card>
      <Button label="🧪 Testni boshlash" onPress={() => { onDone(); router.push(`/quiz?deck=${unit.id}`); }} />
      <Button kind="ghost" label="🎴 Avval kartochkalar" onPress={() => router.push(`/cards?deck=${unit.id}`)} />
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  steps: { paddingHorizontal: PAD, gap: 8, paddingBottom: 8 },
  stepChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card, justifyContent: 'center' },
  stepText: { color: C.text, fontWeight: '600', fontSize: 14, lineHeight: 20 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  quote: { color: C.text, fontSize: 21, lineHeight: 30, fontStyle: 'italic', fontWeight: '600' },
  para: { color: C.text, fontSize: 17, lineHeight: 27 },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
