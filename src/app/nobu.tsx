/**
 * nobu.tsx — Nobu bilan suhbat (matn). Kontekst: dars (key=lesson:f2), Science yoki butun statistika (key=stats).
 * 📞 — o'sha kontekst bilan jonli ovozli suhbat (Gemini Live, Nobu ovozi butun ilovada bir xil).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { nobuChat, type TutorMsg } from '@/lib/ai';
import { buildContext } from '@/lib/nobuContext';
import { T } from '@/ui/kit';
import { NobuSays } from '@/ui/nobu';

const STARTERS: Record<string, string[]> = {
  lesson: ['Bu qonunni boshqacha tushuntirib ber', 'Menga qiyinroq masala ber', 'Bu kundalik hayotda qayerda uchraydi?'],
  stats: ['Eng zaif tomonim nima?', 'Bu hafta nimaga e\'tibor beray?', 'Qayerda o\'syapman?'],
  science: ['Qaysi mavzuni takrorlashim kerak?', 'Menga aralash masala ber'],
};

export default function NobuChat() {
  const insets = useSafeAreaInsets();
  const { key = 'stats', step } = useLocalSearchParams<{ key?: string; step?: string }>();
  const [ctx, setCtx] = useState<{ topic: string; ctx: string } | null>(null);
  const [msgs, setMsgs] = useState<TutorMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);
  useEffect(() => { buildContext(key, step !== undefined ? Number(step) : undefined).then(setCtx); }, [key, step]);
  // Darsdagi "Tushunmadim" — Nobu o'zi boshlaydi
  const asked = useRef(false);
  useEffect(() => { if (ctx && step !== undefined && !asked.current) { asked.current = true; send('Shu qadamni tushunmadim, oddiyroq tushuntirib ber.'); } }, [ctx]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100); }, [msgs, busy]);

  const send = async (q: string) => {
    if (!q.trim() || !ctx || busy) return;
    const h: TutorMsg[] = [...msgs, { role: 'user', text: q.trim() }];
    setMsgs(h); setText(''); setBusy(true); setErr('');
    try { setMsgs([...h, { role: 'nobu', text: await nobuChat(ctx.topic, ctx.ctx, h) }]); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const call = () => ctx && router.push({ pathname: '/live', params: { mode: 'nobu', topic: ctx.topic, ctx: ctx.ctx.slice(0, 9000) } });
  const kind = key.startsWith('lesson:') ? 'lesson' : key;

  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <T bold>🤖 Nobu</T>
          <T dim size={12} style={{}}>{ctx?.topic ?? '...'}</T>
        </View>
        <Pressable onPress={call} style={s.call}><T bold color={C.bg}>📞 Jonli</T></Pressable>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: PAD, gap: 10 }} keyboardShouldPersistTaps="handled">
        <NobuSays text={kind === 'lesson' ? 'Dars bo\'yicha nimani muhokama qilamiz? Tushunmagan joyingizni ayting yoki men sizga savol beray.'
          : kind === 'stats' ? "Barcha natijalaringiz oldimda: ingliz tili, miya o'yinlari, shaxmat, science. Nimani muhokama qilamiz?"
            : 'Matematika, geometriya yoki fizika — nimani muhokama qilamiz?'} />
        {msgs.map((m, i) => m.role === 'nobu' ? <NobuSays key={i} text={m.text} /> : (
          <View key={i} style={s.me}><T size={15}>{m.text}</T></View>
        ))}
        {busy && <T dim>Nobu o'ylayapti...</T>}
        {!!err && <T color={C.red}>{err}</T>}
        {msgs.length === 0 && (
          <View style={{ gap: 8 }}>
            {(STARTERS[kind] ?? STARTERS.stats).map((q) => (
              <Pressable key={q} onPress={() => send(q)} style={s.chip}><T size={14}>{q}</T></Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={[s.bar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Nobu'ga yozing..." placeholderTextColor={C.dim}
          multiline onSubmitEditing={() => send(text)} />
        <Pressable onPress={() => send(text)} disabled={busy || !text.trim()} style={[s.send, (busy || !text.trim()) && { opacity: 0.4 }]}>
          <T bold color={C.bg}>➤</T>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  call: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: C.green },
  me: { alignSelf: 'flex-end', maxWidth: '85%', padding: 12, borderRadius: 16, backgroundColor: 'rgba(96,165,250,0.15)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)' },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.cardBorder },
  bar: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 120, color: C.text, fontSize: 16, padding: 12, borderRadius: 16, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
});
