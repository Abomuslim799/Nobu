/**
 * feynman.tsx — "O'zing tushuntirasan": AI qiziquvchan shogird rolida savol beradi, oxirida 0–100 baho.
 * Server /tutor orqali (alohida endpoint shart emas). Kunlik limit — 5 sessiya (hozircha telefonda hisoblanadi).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { dayKey } from '@/core/date';
import { KEYS } from '@/core/storage';
import { C } from '@/core/theme';
import { Button, T } from '@/core/ui/kit';
import { nobuChat, type TutorMsg } from '@/features/assistant/ai';
import type { Feynman } from '@/features/lesson2/types';

export const FEYN_LIMIT = 5, PASS = 70;

function context(title: string, f: Feynman) {
  return `ROL: Bu suhbatda siz ustoz EMASSIZ. Siz qiziquvchan shogirdsiz va "${title}" mavzusini bilmaysiz.
Foydalanuvchi sizga shu mavzuni tushuntiradi (Feynman usuli).
Qoidalar: o'zingiz tushuntirmang va to'g'ri javobni aytmang. Har javobda faqat 1 ta qisqa savol bering (1–2 gap):
tushuntirishdagi bo'shliqni oching, sodda til yoki misol so'rang. Matematik xatoni sezsangiz — "tushunmadim, nega?" deb so'rang.
Tekshiruv ro'yxati (foydalanuvchi shularni tushuntirishi kerak):
${f.checklist.map((c, i) => `${i + 1}) ${c}`).join('\n')}
Savol namunalari: ${f.followups.join(' | ')}
Foydalanuvchi 4 marta javob bergach yoki "Baholang" desa — shogird rolidan chiqing va baholang:
birinchi qator aniq "BAHO: <0-100>", keyin 1–2 gapda nima yetishmadi (ro'yxat bo'yicha).
Mezonlar: to'liqlik, aniqlik, misol, sodda til. Faqat ro'yxatdagi nuqtalar uchun ball bering, o'zingizdan qo'shmang.`;
}
const scoreOf = (t: string) => { const m = t.match(/BAHO:\s*(\d{1,3})/i); return m ? Math.min(100, Number(m[1])) : null; };

export function FeynmanChat({ title, spec, onScore }: { title: string; spec: Feynman; onScore: (s: number | null) => void }) {
  const [msgs, setMsgs] = useState<TutorMsg[]>([{ role: 'nobu', text: spec.task }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const counted = useRef(false);
  const key = `${KEYS.v2feyn}.${dayKey()}`;

  useEffect(() => { AsyncStorage.getItem(key).then((r) => setLeft(FEYN_LIMIT - Number(r ?? 0))).catch(() => setLeft(FEYN_LIMIT)); }, [key]);

  const send = async (t: string) => {
    if (!t.trim() || busy) return;
    if (!counted.current) {                       // sessiya birinchi xabarda hisoblanadi
      counted.current = true;
      const used = FEYN_LIMIT - (left ?? FEYN_LIMIT) + 1;
      AsyncStorage.setItem(key, String(used)).catch(() => {});
      setLeft(FEYN_LIMIT - used);
    }
    const next: TutorMsg[] = [...msgs, { role: 'user', text: t.trim() }];
    setMsgs(next); setText(''); setBusy(true); setErr('');
    try {
      const reply = await nobuChat(`Feynman: ${title}`, context(title, spec), next);
      setMsgs([...next, { role: 'nobu', text: reply }]);
      const s = scoreOf(reply);
      if (s !== null) { setScore(s); onScore(s); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const userTurns = msgs.filter((m) => m.role === 'user').length;
  if (left !== null && left <= 0 && !counted.current) {
    return (
      <View style={{ gap: 8 }}>
        <T dim>Bugungi limit tugadi ({FEYN_LIMIT} ta sessiya). Ertaga yana urinib ko'ring.</T>
        <Button kind="ghost" label="O'tkazib yuborish" onPress={() => onScore(null)} />
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {msgs.map((m, i) => (
        <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: 10, borderRadius: 12,
          backgroundColor: m.role === 'user' ? C.greenSoft : C.surface2, borderWidth: 1, borderColor: C.cardBorder }}>
          <T size={15}>{m.role === 'nobu' && scoreOf(m.text) === null ? '🧑‍🎓 ' : ''}{m.text}</T>
        </View>
      ))}
      {busy && <ActivityIndicator color={C.green} />}
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {score === null ? (
        <>
          <TextInput value={text} onChangeText={setText} multiline placeholder="O'z so'zlaringiz bilan tushuntiring…" placeholderTextColor={C.dim}
            style={{ minHeight: 70, color: C.text, fontSize: 16, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button label="Yuborish" onPress={() => send(text)} disabled={busy || !text.trim()} /></View>
            {userTurns >= 2 && <View style={{ flex: 1 }}><Button kind="ghost" label="Baholang" onPress={() => send('Baholang.')} disabled={busy} /></View>}
          </View>
          <T dim size={12}>Bugun qoldi: {left ?? '…'} / {FEYN_LIMIT} sessiya · {PASS}+ ball — 🌳</T>
          {!!err && <Button kind="ghost" label="O'tkazib yuborish" onPress={() => onScore(null)} />}
        </>
      ) : (
        <T bold color={score >= PASS ? C.good : C.gold}>{score >= PASS ? `🌳 ${score} ball — mavzu to'liq o'zlashtirildi` : `${score} ball — ${PASS} dan kam. Keyinroq qayta urinib ko'ring.`}</T>
      )}
    </View>
  );
}
