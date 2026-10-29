/**
 * unit/[id].tsx — ingliz tili uniti 7 qadamda (Kirish → Reading → So'zlar → Grammatika →
 * Listening → Speaking → Test). Har qadam tugaganda belgilanadi va kunlik maqsadga qo'shiladi.
 * Kontent: src/data/units/*.json. Ovozlar: London (Ryan), GitHub'da yasaladi.
 */

import {
  RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD, R } from '@/constants/theme';
import { STEPS, UNITS, type StepId, type Unit } from '@/data/units';
import { useProgress } from '@/lib/progress';
import { say, stopSpeaking } from '@/lib/speak';
import { Choice, Rich } from '@/ui/choice';
import { Button, Card, T } from '@/ui/kit';
import { RateSwitch, SoundButton } from '@/ui/sound';
import { Stress } from '@/ui/stress';

export default function UnitScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = UNITS.find((u) => u.id === id);
  const { data, completeUnitStep } = useProgress();
  const done = data.unitSteps[id] ?? [];
  const [step, setStep] = useState<StepId>(() => STEPS.find((x) => !done.includes(x.id))?.id ?? 'hook');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  if (!unit) return <View style={s.root}><T>Unit topilmadi</T></View>;

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.steps}>
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
        {step === 'hook' && <Hook unit={unit} onDone={() => finish()} />}
        {step === 'read' && <Reading unit={unit} onDone={finish} />}
        {step === 'vocab' && <Vocab unit={unit} onDone={() => finish()} />}
        {step === 'grammar' && <Grammar unit={unit} onDone={finish} />}
        {step === 'listen' && <Listening unit={unit} onDone={finish} />}
        {step === 'speak' && <Speaking unit={unit} onDone={() => finish()} />}
        {step === 'test' && <TestStep unit={unit} onDone={() => finish()} />}
      </ScrollView>
    </View>
  );
}

// ── 1. Kirish ───────────────────────────────────────────────────────────────
function Hook({ unit, onDone }: { unit: Unit; onDone: () => void }) {
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
      <T dim>Daraja: {unit.level} · Reja: matn → 20 so'z → grammatika → tinglash → gapirish → test</T>
      <Button label="Boshladik →" onPress={onDone} />
    </>
  );
}

// ── 2. Reading ──────────────────────────────────────────────────────────────
function Reading({ unit, onDone }: { unit: Unit; onDone: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const stems = [...unit.vocab, ...unit.collocations].map((w) => w.word.replace(/^to /, '').split(' ')[0].toLowerCase());
  const correct = Object.values(answers).filter(Boolean).length;
  const all = Object.keys(answers).length === unit.questions.length;

  return (
    <>
      <T dim>Matnni o'qing. Yashil so'zlar — keyingi qadamda o'rganiladi. Har xatboshini eshitish mumkin.</T>
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
      <T bold size={17}>Tushundingizmi?</T>
      {unit.questions.map((q, i) => (
        <Choice key={i} q={q.q} options={q.options} answer={q.answer}
          onAnswer={(ok) => setAnswers((a) => ({ ...a, [i]: ok }))} />
      ))}
      {all && <T bold>{correct}/{unit.questions.length} to'g'ri</T>}
      <Button label="Keyingisi: so'zlar →" disabled={!all} onPress={() => onDone(correct)} />
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
      <T bold size={18}>15 ta so'z</T>
      {unit.vocab.map(row)}
      <T bold size={18}>5 ta collocation — birga ishlatiladigan so'zlar</T>
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
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const correct = Object.values(answers).filter(Boolean).length;
  const all = Object.keys(answers).length === g.exercises.length;
  return (
    <>
      <T bold size={19}>{g.title}</T>
      {g.explain.map((e, i) => <Card key={i}><Rich text={e} /></Card>)}
      <T bold size={17}>Mashq ({g.exercises.length})</T>
      {g.exercises.map((x, i) => (
        <Choice key={i} q={x.q.replace('___', '_____')} options={x.options} answer={x.answer} why={x.why}
          onAnswer={(ok) => setAnswers((a) => ({ ...a, [i]: ok }))} />
      ))}
      {all && <T bold>{correct}/{g.exercises.length} to'g'ri{correct < g.exercises.length ? ' — xatolar izohini qayta o\'qing' : ''}</T>}
      <Button label="Keyingisi: listening →" disabled={!all} onPress={() => onDone(correct)} />
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
          <Button label="Keyingisi: speaking →" onPress={() => onDone(correct)} />
        </>
      ) : (
        <Button label="Tekshirish" onPress={() => setChecked(true)} />
      )}
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
        <T dim size={14}>Shu unitning 20 so'zi: tarjima ↔ so'z, ovoz → so'z, gapdagi bo'sh joy. Xato topilgan so'zlar kartochkalarda tezroq qaytadi.</T>
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
  stepChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card },
  stepText: { color: C.text, fontWeight: '600', fontSize: 14 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  quote: { color: C.text, fontSize: 21, lineHeight: 30, fontStyle: 'italic', fontWeight: '600' },
  para: { color: C.text, fontSize: 17, lineHeight: 27 },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
