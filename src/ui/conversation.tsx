/**
 * conversation.tsx — mikrofon (useMic) va AI bilan ovozli suhbat (Conversation).
 * Movie'ning Speaking bosqichida ham, alohida "Mashq → Speaking" bo'limida ham ishlatiladi.
 * Suhbat tugaganda (🏁) natija ko'nikmalar jurnaliga yoziladi.
 */

import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { C } from '@/constants/theme';
import { chatTurn, type ChatMsg, type ChatResult } from '@/lib/ai';
import { logSkill } from '@/lib/skills';
import { say, stopSpeaking } from '@/lib/speak';
import { Button, Card, T } from '@/ui/kit';

/** Mikrofon bilan yozish: bitta yozuvchi, qaysi narsa yozilayotgani `tag` bilan belgilanadi. */
export function useMic() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [tag, setTag] = useState<string | null>(null);
  const start = async (t: string) => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { Alert.alert('Mikrofon', 'Sozlamalar → Expo Go → Mikrofon ruxsatini yoqing.'); return; }
    stopSpeaking();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setTag(t);
  };
  /** To'xtatadi va yozuv faylini qaytaradi. */
  const stop = async (): Promise<string | null> => {
    await recorder.stop();
    // Yozib bo'lgach — ovoz yana karnaydan chiqsin (iOS yozish rejimida qulog'i yonidagi dinamikka o'tadi).
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setTag(null);
    return recorder.uri ?? null;
  };
  return { tag, start, stop };
}

/** 2) Suhbat: siz ovoz yuborasiz, Gemini film haqida javob beradi va xatolaringizni tuzatadi. */
export function Conversation({ topic, title, words, mic }: { topic: string; title: string; words: string[]; mic: ReturnType<typeof useMic> }) {
  const [msgs, setMsgs] = useState<(ChatMsg & { fix?: ChatResult })[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ended, setEnded] = useState('');

  /** Ball: har bir gapdagi xatolar soniga qarab (0 xato — 100, har xato −15). */
  const finish = () => {
    const turns = msgs.filter((m) => m.role === 'user');
    const fixes = turns.flatMap((m) => m.fix?.corrections ?? []);
    const score = Math.max(0, 100 - Math.round((fixes.length / Math.max(1, turns.length)) * 15));
    logSkill('speaking', score, topic, fixes.map((f) => `${f.wrong} → ${f.right}`));
    setEnded(`${turns.length} ta javob, ${fixes.length} ta xato, ${score}%`);
  };

  const send = async () => {
    const uri = await mic.stop();
    if (!uri) return;
    setBusy(true); setErr('');
    try {
      const r = await chatTurn(uri, msgs, topic, words);
      setMsgs((m) => [...m, { role: 'user', text: r.transcript, fix: r }, { role: 'ai', text: r.reply }]);
      say('chat', 'r', r.reply);           // javobni britancha ovozda o'qiydi
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card style={{ gap: 6, marginTop: 8 }}>
        <T bold>{title}</T>
        <T dim size={14}>🎙 bosib inglizcha gapiring (mavzu bo'yicha, o'z fikringiz). AI javob beradi, savol beradi va xatolaringizni ko'rsatadi. Kamida 5 marta almashing.</T>
      </Card>
      {msgs.map((m, i) => (
        <Card key={i} style={{ gap: 4, borderColor: m.role === 'ai' ? C.green : C.cardBorder }}>
          <T dim size={12}>{m.role === 'ai' ? '🤖 Nobu' : '🧑 Siz'}</T>
          <T>{m.text}</T>
          {m.role === 'ai' && (
            <Pressable onPress={() => say('chat', 'r', m.text)}><T dim size={13}>🔊 qayta eshitish</T></Pressable>
          )}
          {m.fix?.corrections.map((c, k) => (
            <T key={k} size={14}>✏️ <Text style={{ color: C.red }}>{c.wrong}</Text> → <Text style={{ color: C.green }}>{c.right}</Text> · {c.why_uz}</T>
          ))}
          {!!m.fix?.pronunciation_uz && <T size={14}>🗣 {m.fix.pronunciation_uz}</T>}
        </Card>
      ))}
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {msgs.length >= 4 && !ended && (
        <Button kind="ghost" label="🏁 Suhbatni yakunlash (natijani saqlash)" onPress={finish} />
      )}
      {ended && <T color={C.green}>Saqlandi: {ended}</T>}
      {mic.tag === 'chat' ? (
        <Button label="⏹ Yuborish" onPress={send} />
      ) : (
        <Button kind="ghost" label={busy ? '⏳ Javob kutilmoqda...' : msgs.length ? '🎙 Javob berish' : '🎙 Suhbatni boshlash'}
          disabled={busy || mic.tag !== null} onPress={() => mic.start('chat')} />
      )}
    </>
  );
}

