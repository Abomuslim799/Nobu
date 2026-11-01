/**
 * nobu/chat.tsx — Nobu bilan suhbat (matn). Kontekst: dars (key=lesson:f2), Science yoki butun statistika (key=stats).
 * 📞 — o'sha kontekst bilan jonli ovozli suhbat (Gemini Live, Nobu ovozi butun ilovada bir xil).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/core/theme';
import { nobuChat, type TutorMsg } from '@/features/assistant/ai';
import { buildContext } from '@/features/assistant/context';
import { ttsUrl } from '@/core/tts';
import { sayText } from '@/features/science/speech';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { T } from '@/core/ui/kit';
import { Avatar, Bubble, type Who } from '@/core/ui/avatar';

const STARTERS: Record<string, string[]> = {
  lesson: ['Bu qonunni boshqacha tushuntirib bering', 'Menga qiyinroq masala bering', 'Bu kundalik hayotda qayerda uchraydi?'],
  stats: ['Eng zaif tomonim nima?', 'Bu hafta nimaga e\'tibor beray?', 'Qayerda o\'syapman?'],
  science: ['Qaysi mavzuni takrorlashim kerak?', 'Menga aralash masala bering'],
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
  // 🔊 Javobni ovozda eshitish (server: Gemini/ElevenLabs; bu matnlar oldindan yasalmagan — bosilganda yasaladi)
  const player = useRef<AudioPlayer | null>(null);
  const [voice, setVoice] = useState<{ i: number; st: 'load' | 'play' | 'err' | '' }>({ i: -1, st: '' });
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const p = createAudioPlayer(null);
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (st) => { if (st.didJustFinish) setVoice({ i: -1, st: '' }); });
    return () => { sub.remove(); p.remove(); };
  }, []);
  const say = async (i: number, t: string) => {
    const p = player.current;
    if (!p) return;
    if (voice.i === i && voice.st === 'play') { p.pause(); setVoice({ i: -1, st: '' }); return; }
    p.pause();
    setVoice({ i, st: 'load' });
    const url = await ttsUrl(sayText(t));
    if (!url) { setVoice({ i, st: 'err' }); return; }
    p.replace({ uri: url }); p.play();
    setVoice({ i, st: 'play' });
  };
  useEffect(() => { buildContext(key, step !== undefined ? Number(step) : undefined).then(setCtx); }, [key, step]);
  // Darsdagi "Tushunmadim" — Nobu o'zi boshlaydi
  const asked = useRef(false);
  useEffect(() => { if (ctx && step !== undefined && !asked.current) { asked.current = true; send('Shu qadamni tushunmadim, oddiyroq tushuntirib bering.'); } }, [ctx]);    
  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100); }, [msgs, busy]);

  // Kutish: soniyalar sanaladi, "Bekor qilish" — javobni kutmaymiz (kech kelsa, e'tiborsiz qoldiriladi)
  const reqId = useRef(0);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!busy) return;
    setSec(0);
    const t = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  const send = async (q: string) => {
    if (!q.trim() || !ctx || busy) return;
    const h: TutorMsg[] = [...msgs, { role: 'user', text: q.trim() }];
    const my = ++reqId.current;
    setMsgs(h); setText(''); setBusy(true); setErr('');
    try {
      const reply = await nobuChat(ctx.topic, ctx.ctx, h);
      if (my === reqId.current) setMsgs([...h, { role: 'nobu', text: reply }]);
    } catch (e) {
      if (my === reqId.current) setErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (my === reqId.current) setBusy(false);
    }
  };
  const cancel = () => { reqId.current++; setBusy(false); setErr("Bekor qilindi. Savolni qayta yuborishingiz mumkin."); };
  const call = () => ctx && router.push({ pathname: '/nobu/live', params: { mode: 'nobu', topic: ctx.topic, ctx: ctx.ctx.slice(0, 9000) } });
  const kind = key.startsWith('lesson:') ? 'lesson' : key;
  const who: Who = kind === 'stats' ? 'nobu' : 'ustoz';     // darslar va Science — Ustoz, statistika — Nobu

  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Avatar who={who} size={28} /><T bold>{who === 'ustoz' ? 'Ustoz Farobiy' : 'Nobu'}</T></View>
          <T dim size={12} style={{}}>{ctx?.topic ?? '...'}</T>
        </View>
        <Pressable onPress={call} style={s.call}><T bold color={C.onAccent}>📞 Jonli</T></Pressable>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: PAD, gap: 10 }} keyboardShouldPersistTaps="handled">
        <Bubble who={who} pose="kitob" text={kind === 'lesson' ? 'Dars bo\'yicha nimani muhokama qilamiz? Tushunmagan joyingizni ayting yoki men sizga savol beray.'
          : kind === 'stats' ? "Barcha natijalaringiz oldimda: ingliz tili, miya o'yinlari, shaxmat, science. Nimani muhokama qilamiz?"
            : 'Matematika, geometriya yoki fizika — nimani muhokama qilamiz?'} />
        {msgs.map((m, i) => m.role === 'nobu' ? (
          <View key={i} style={{ gap: 4 }}>
            <Bubble who={who} text={m.text} />
            <Pressable onPress={() => say(i, m.text)} hitSlop={8} style={s.say}>
              <T size={13} color={C.green}>{voice.i === i ? (voice.st === 'load' ? '⏳ ovoz tayyorlanmoqda…' : voice.st === 'play' ? '⏸ to\'xtatish' : voice.st === 'err' ? '⚠️ ovoz yo\'q (server)' : '🔊 eshitish') : '🔊 eshitish'}</T>
            </Pressable>
          </View>
        ) : (
          <View key={i} style={s.me}><T size={15}>{m.text}</T></View>
        ))}
        {busy && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar who={who} pose="oyla" size={30} />
            <T dim>{who === 'ustoz' ? 'Ustoz' : 'Nobu'} o'ylayapti... {sec}s</T>
            {sec >= 5 && <Pressable onPress={cancel} hitSlop={8}><T color={C.red} size={13}>✕ Bekor qilish</T></Pressable>}
          </View>
        )}
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
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder={who === 'ustoz' ? "Ustozga yozing..." : "Nobu'ga yozing..."} placeholderTextColor={C.dim}
          multiline onSubmitEditing={() => send(text)} />
        <Pressable onPress={() => send(text)} disabled={busy || !text.trim()} style={[s.send, (busy || !text.trim()) && { opacity: 0.4 }]}>
          <T bold color={C.onAccent}>➤</T>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  say: { alignSelf: 'flex-start', marginLeft: 58, paddingVertical: 2 },
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.subtle },
  call: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: C.green },
  me: { alignSelf: 'flex-end', maxWidth: '85%', padding: 12, borderRadius: 16, backgroundColor: 'rgba(96,165,250,0.15)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)' },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.cardBorder },
  bar: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.subtle, alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 120, color: C.text, fontSize: 16, padding: 12, borderRadius: 16, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
});
