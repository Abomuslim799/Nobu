/** Speaking: shadowing, AI talaffuz bahosi. */

import { createAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { type Unit } from '@/features/english/data/units';
import { shadowScore, type ShadowResult } from '@/features/english/ai';
import { logSkill } from '@/features/english/skills';
import { useMic } from '@/features/english/mic';
import { Button, Card, T } from '@/core/ui/kit';
import { SoundButton } from '@/features/english/ui/sound';
import { s } from '@/features/english/unit/styles';

// ── 6. Speaking — shadowing (Gemini baholaydi) + suhbat ─────────────────────
export function Speaking({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  const mic = useMic();
  const [mine, setMine] = useState<Record<number, string>>({});
  const [score, setScore] = useState<Record<number, ShadowResult | 'wait' | string>>({});
  const playMine = (uri: string) => createAudioPlayer(uri).play();

  const stopLine = async (i: number) => {
    const uri = await mic.stop();
    if (uri) setMine((m) => ({ ...m, [i]: uri }));
  };
  const rate = async (i: number) => {
    setScore((x) => ({ ...x, [i]: 'wait' }));
    try {
      const r = await shadowScore(mine[i], unit.shadowing[i]);
      setScore((x) => ({ ...x, [i]: r }));
      logSkill('speaking', r.accuracy, `Talaffuz · ${unit.source}`, r.wrong_words.map((w) => `${w.word} → "${w.heard}"`));
    } catch (e) {
      setScore((x) => ({ ...x, [i]: e instanceof Error ? e.message : String(e) }));
    }
  };

  return (
    <>
      <Card style={{ gap: 6 }}>
        <T bold>1) Shadowing — talaffuz</T>
        <T dim size={14}>Asl ovozni eshiting → 🎙 yozing → 📊 Baholash. Gemini aniqlikni %, xato so'zlar va urg'uni ko'rsatadi. 85%+ ga erishguncha takrorlang.</T>
      </Card>
      {unit.shadowing.map((line, i) => {
        const r = score[i];
        return (
          <Card key={i} style={{ gap: 10 }}>
            <Text style={s.para}>{line}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <SoundButton id={unit.id} part={`sh${i}`} text={line} label="Asl" />
              {mic.tag === `sh${i}` ? (
                <Pressable style={[s.ghostBtn, { borderColor: C.red }]} onPress={() => stopLine(i)}>
                  <Text style={{ color: C.red, fontWeight: '700' }}>⏹ To'xtatish</Text>
                </Pressable>
              ) : (
                <Pressable style={s.ghostBtn} disabled={mic.tag !== null} onPress={() => mic.start(`sh${i}`)}>
                  <Text style={{ color: C.text, fontWeight: '600' }}>🎙 Yozish</Text>
                </Pressable>
              )}
              {mine[i] && (
                <>
                  <Pressable style={s.ghostBtn} onPress={() => playMine(mine[i])}>
                    <Text style={{ color: C.text, fontWeight: '600' }}>▶ Mening ovozim</Text>
                  </Pressable>
                  <Pressable style={s.ghostBtn} disabled={r === 'wait'} onPress={() => rate(i)}>
                    <Text style={{ color: C.green, fontWeight: '700' }}>{r === 'wait' ? '⏳ ...' : '📊 Baholash'}</Text>
                  </Pressable>
                </>
              )}
            </View>
            {typeof r === 'string' && r !== 'wait' && <T color={C.red} size={13}>{r}</T>}
            {r && typeof r === 'object' && (
              <View style={{ gap: 4 }}>
                <T bold color={r.accuracy >= 85 ? C.green : r.accuracy >= 60 ? C.text : C.red}>Aniqlik: {r.accuracy}%</T>
                <T dim size={13}>Eshitildi: “{r.transcript}”</T>
                {r.wrong_words.map((w, k) => (
                  <T key={k} size={14}>❌ <Text style={{ fontWeight: '700', color: C.text }}>{w.word}</Text> → “{w.heard}” · {w.tip_uz}</T>
                ))}
                {!!r.stress_uz && <T size={14}>🎵 {r.stress_uz}</T>}
                <T size={14}>💡 {r.feedback_uz}</T>
              </View>
            )}
          </Card>
        );
      })}
      <Card style={{ gap: 6, marginTop: 8 }}>
        <T bold>2) Jonli suhbat — {unit.source}</T>
        <T dim size={14}>Telefon qo'ng'irog'idek: siz gapirasiz, Nobu darhol ovoz bilan javob beradi, uning gapini bo'lishingiz ham mumkin. Oxirida AI xatolaringiz va ballni ko'rsatadi.</T>
        <Button label="📞 Jonli suhbatni boshlash" onPress={() => router.push({ pathname: '/nobu/live', params: {
          topic: `the film "${unit.source}"`, words: [...unit.vocab, ...unit.collocations].map((w) => w.word).join(','),
        } })} />
      </Card>
      <Button label="Keyingisi: test →" onPress={onDone} />
    </>
  );
}
