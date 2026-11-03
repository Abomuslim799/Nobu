/**
 * feynman.tsx — "O'zing tushuntirasan": AI qiziquvchan shogird rolida savol beradi, oxirida qat'iy baho.
 * Baho: har tekshiruv nuqtasi 0 / 10 / 25 (AI "BALL: a,b,c,d" qaytaradi), umumiy yig'indini ilova o'zi hisoblaydi.
 * AI ro'yxatdagi har nuqtani so'ramaguncha baholamaydi; 8 ta javobdan keyin baho majburiy.
 * Server /tutor, smart=true — kuchliroq model. Kunlik limit — 5 sessiya (hozircha telefonda hisoblanadi).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { dayKey } from '@/core/date';
import { KEYS } from '@/core/storage';
import { C } from '@/core/theme';
import { Button, T } from '@/core/ui/kit';
import { nobuChat, type TutorMsg } from '@/features/assistant/ai';
import { feynScore, type Feynman } from '@/features/lesson2/types';

export const FEYN_LIMIT = 5, PASS = 70, MAX_TURNS = 8;

function context(title: string, f: Feynman) {
  return `ROL: Siz qiziquvchan shogirdsiz va "${title}" mavzusini bilmaysiz. Foydalanuvchi sizga shu mavzuni tushuntiradi (Feynman usuli).
QOIDALAR:
- O'zingiz tushuntirmang va to'g'ri javobni aytmang. Maqtamang: "tushunarli", "zo'r", "yaxshi", "to'g'ri" demang.
- Har javobda faqat 1 ta qisqa savol (1–2 gap).
- Foydalanuvchining gapi YADRO ga zid yoki noaniq bo'lsa — qabul qilmang, aynan shu gapni so'roq qiling (masalan: "Lekin gorizontal chiziq umuman qiya emas-ku?").
- Foydalanuvchi "bilmayman", "menga ham qiziq" desa — o'zingiz javob bermang, shu nuqta ochiq qoladi (0 ball), keyingi nuqtaga o'ting.
- Ro'yxatdagi HAR BIR nuqta haqida kamida bir marta so'rang. Hamma nuqta so'ralgandan keyingina, yoki foydalanuvchi "Baholang" desa, baholang.
YADRO (to'g'ri bilim — faqat tekshirish uchun, foydalanuvchiga aytmang): ${f.core}
TEKSHIRUV RO'YXATI:
${f.checklist.map((c, i) => `${i + 1}) ${c.point}`).join('\n')}
Savol namunalari: ${f.followups.join(' | ')}
BAHOLASH (shogird rolidan chiqib). Birinchi qator aynan shunday: "BALL: a,b,c,d" — ro'yxat tartibida har nuqta uchun:
25 — o'z so'zlari bilan to'g'ri va to'liq; 10 — qisman, bitta so'z, xatoli yoki faqat savolga "ha/yo'q"; 0 — aytilmagan, "bilmayman" yoki noto'g'ri.
Qattiqqo'l bo'ling: bitta so'zli javob 25 olmaydi; so'ralmagan yoki javob berilmagan nuqta — 0.
Keyin 25 dan kam har nuqta uchun 1 gap: nima yetishmadi.`;
}

export function FeynmanChat({ title, spec, onScore }: { title: string; spec: Feynman; onScore: (s: number | null) => void }) {
  const [msgs, setMsgs] = useState<TutorMsg[]>([{ role: 'nobu', text: spec.task }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ items: number[]; total: number } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const counted = useRef(false);
  const key = `${KEYS.v2feyn}.${dayKey()}`;
  const n = spec.checklist.length;

  useEffect(() => { AsyncStorage.getItem(key).then((r) => setLeft(FEYN_LIMIT - Number(r ?? 0))).catch(() => setLeft(FEYN_LIMIT)); }, [key]);

  const userTurns = msgs.filter((m) => m.role === 'user').length;
  const send = async (t: string) => {
    if (!t.trim() || busy) return;
    if (!counted.current) {                       // sessiya birinchi xabarda hisoblanadi
      counted.current = true;
      const used = FEYN_LIMIT - (left ?? FEYN_LIMIT) + 1;
      AsyncStorage.setItem(key, String(used)).catch(() => {});
      setLeft(FEYN_LIMIT - used);
    }
    const forced = userTurns + 1 >= MAX_TURNS && !/^baholang/i.test(t.trim());
    const shown: TutorMsg[] = [...msgs, { role: 'user', text: t.trim() }];
    const sent: TutorMsg[] = forced ? [...msgs, { role: 'user', text: `${t.trim()}\n\nBaholang.` }] : shown;
    setMsgs(shown); setText(''); setBusy(true); setErr('');
    try {
      const reply = await nobuChat(`Feynman: ${title}`, context(title, spec), sent, true);
      const r = feynScore(reply, n);
      setMsgs([...shown, { role: 'nobu', text: r ? reply.replace(/^.*BALL:.*$/im, '').trim() : reply }]);
      if (r) { setResult(r); onScore(r.total); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

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
          <T size={15}>{m.role === 'nobu' && !(result && i === msgs.length - 1) ? '🧑‍🎓 ' : ''}{m.text}</T>
        </View>
      ))}
      {busy && <ActivityIndicator color={C.green} />}
      {!!err && <T color={C.red} size={13}>{err}</T>}
      {!result ? (
        <>
          <TextInput value={text} onChangeText={setText} multiline placeholder="O'z so'zlaringiz bilan tushuntiring…" placeholderTextColor={C.dim}
            style={{ minHeight: 70, color: C.text, fontSize: 16, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button label="Yuborish" onPress={() => send(text)} disabled={busy || !text.trim()} /></View>
            {userTurns >= 2 && <View style={{ flex: 1 }}><Button kind="ghost" label="Baholang" onPress={() => send('Baholang.')} disabled={busy} /></View>}
          </View>
          <T dim size={12}>Javob {userTurns}/{MAX_TURNS} · bugun qoldi {left ?? '…'}/{FEYN_LIMIT} sessiya · {PASS}+ ball kerak</T>
          {!!err && <Button kind="ghost" label="O'tkazib yuborish" onPress={() => onScore(null)} />}
        </>
      ) : (
        <View style={{ gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: result.total >= PASS ? C.good : C.gold, backgroundColor: C.card }}>
          <T bold size={17} color={result.total >= PASS ? C.good : C.gold}>Feynman: {result.total} / 100 {result.total >= PASS ? '✓' : `· ${PASS} kerak`}</T>
          {spec.checklist.map((c, i) => (
            <View key={i} style={{ gap: 1 }}>
              <T size={14}>{result.items[i] === 25 ? '✅' : result.items[i] === 10 ? '🟡' : '❌'} {c.point} — {result.items[i]}</T>
              {result.items[i] < 25 && <T dim size={12}>   ↳ qayta ko'ring: {c.review}</T>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
