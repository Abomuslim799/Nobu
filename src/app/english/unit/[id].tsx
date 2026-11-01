/**
 * unit/[id].tsx — bitta Movie 7 qadamda: Vocab → Grammar → Reading → Listening → Writing →
 * Speaking → Test. Har qadam tugaganda belgilanadi va kunlik maqsadga qo'shiladi.
 * Kontent: src/data/units/*.json. Ovozlar: London (Ryan), GitHub'da yasaladi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { STEPS, UNITS, type StepId } from '@/features/english/data/units';
import { useProgress } from '@/core/store';
import { logSkill } from '@/features/english/skills';
import { stopSpeaking } from '@/core/audio/speak';
import { T } from '@/core/ui/kit';
import { RateSwitch } from '@/core/ui/sound';
import { s } from '@/features/english/unit/styles';
import { Reading } from '@/features/english/unit/reading';
import { Vocab } from '@/features/english/unit/vocab';
import { Grammar } from '@/features/english/unit/grammar';
import { Listening } from '@/features/english/unit/listening';
import { Writing } from '@/features/english/unit/writing';
import { Speaking } from '@/features/english/unit/speaking';
import { TestStep } from '@/features/english/unit/test';

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
    // Ko'nikmalar jurnali (statistika va AI tahlil uchun)
    if (step === 'grammar') logSkill('grammar', (score / unit.grammar.exercises.length) * 100, unit.grammar.title);
    if (step === 'listen') logSkill('listening', (score / unit.dictation.length) * 100, unit.source);
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
            <Text style={[s.stepText, step === x.id && { color: C.onAccent }]}>
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

