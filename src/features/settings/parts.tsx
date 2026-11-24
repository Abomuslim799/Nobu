/**
 * parts.tsx — Sozlamalar bo'limlari: ko'rinish, server (widget + AI), Ustoz ovozi tekshiruvi, server zaxirasi.
 *   (Avval Nobu ekranida edi — endi hammasi Sozlamalar sahifasida.)
 */

import { useEffect, useState } from 'react';
import { Alert, DevSettings, Pressable, TextInput, View } from 'react-native';
import * as Updates from 'expo-updates';

import { backupNow, lastBackup, restoreLatest } from '@/core/backup';
import { getConfig, saveConfig, testConnection } from '@/core/server';
import { C, THEMES, THEME_ID, setTheme } from '@/core/theme';
import { Button, Card, T } from '@/core/ui/kit';

/** 🎨 Ko'rinish: mavzu tanlash — ilova yangi ranglar bilan qayta ochiladi. */
export function ThemePick() {
  return (
    <Card style={{ gap: 8 }}>
      <T bold>🎨 Ko'rinish</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {THEMES.map((t) => (
          <Pressable key={t.id} onPress={() => { if (t.id === THEME_ID) return; setTheme(t.id); Updates.reloadAsync().catch(() => DevSettings.reload()); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: t.c.bg, borderWidth: 1.5, borderColor: t.id === THEME_ID ? t.c.green : t.c.cardBorder }}>
            <View style={{ flexDirection: 'row' }}>{[t.c.card, t.c.green, t.c.gold].map((x, i) => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: x, marginLeft: i ? -3 : 0 }} />)}</View>
            <T size={13} color={t.c.text}>{t.name}</T>
          </Pressable>
        ))}
      </View>
      <T dim size={11}>Tanlansa ilova qayta ochiladi.</T>
    </Card>
  );
}

/** Widget uchun server (Railway): manzil + APP_TOKEN telefonda saqlanadi. */
export function ServerLink() {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    getConfig().then((c) => {
      if (c) { setUrl(c.url); setToken(c.token); setStatus('Ulangan'); }
    });
  }, []);

  const save = async () => {
    if (!url.startsWith('https://') || !token) return Alert.alert('Manzil https:// bilan boshlansin va token kiritilsin');
    setStatus('Tekshirilmoqda…');
    try {
      const msg = await testConnection({ url, token });
      await saveConfig({ url, token });
      setStatus(`Ulandi ✓ ${msg}`);
    } catch (e) {
      setStatus(`Xato: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <Card style={{ gap: 8 }}>
      <T bold>🔗 Server (widget + AI)</T>
      <T dim size={13}>Widget uchun streak va Speaking/Writing AI shu server orqali ishlaydi.</T>
      <TextInput style={input} placeholder="https://....up.railway.app" placeholderTextColor={C.dim}
        value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <TextInput style={input} placeholder="APP_TOKEN" placeholderTextColor={C.dim}
        value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} secureTextEntry />
      <Button label="Saqlash va tekshirish" onPress={save} />
      {!!status && <T dim size={13}>{status}</T>}
      <VoiceCheck />
      <BackupBox />
    </Card>
  );
}

/** Ustoz ovozini tekshirish: Gemini (server) ishlayaptimi, ishlamasa — sababi. */
function VoiceCheck() {
  const [msg, setMsg] = useState('');
  const check = async () => {
    setMsg('Tekshirilmoqda…');
    const tts = await import('@/core/tts');
    const url = await tts.ttsUrl(`Ovoz sinovi ${new Date().getMinutes()}`);
    setMsg(url ? 'Gemini ovozi ishlayapti ✓' : `Gemini ovozi ishlamayapti — darslarda zaxira ovoz (Sardor) chalinadi.\nSabab: ${tts.ttsError() || 'server sozlanmagan'}`);
  };
  return (
    <View style={{ gap: 6 }}>
      <Button kind="ghost" label="🔊 Ustoz ovozini tekshirish" onPress={check} />
      {!!msg && <T dim size={13}>{msg}</T>}
    </View>
  );
}

function BackupBox() {
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => lastBackup()
    .then((b) => setInfo(b.ts ? `Oxirgi zaxira: ${b.ts.slice(0, 16).replace('T', ' ')} · ${Math.round((b.size ?? 0) / 1024)} KB` : "Serverda zaxira hali yo'q"))
    .catch((e) => setInfo(e instanceof Error ? e.message : String(e)));
  useEffect(() => { refresh(); }, []);
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    try { await f(); await refresh(); } catch (e) { setInfo(`Xato: ${e instanceof Error ? e.message : String(e)}`); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    try { await backupNow(); } catch (e) {
      if (!String(e).includes('kichik')) throw e;
      await new Promise<void>((ok, no) => Alert.alert('Zaxira avvalgisidan ancha kichik',
        "Telefondagi ma'lumot serverdagidan kam. Baribir saqlaysizmi? (Yangi telefon bo'lsa — avval 'Tiklash' ni bosing.)",
        [{ text: 'Bekor', style: 'cancel', onPress: () => no(new Error('bekor qilindi')) },
         { text: 'Baribir saqlash', style: 'destructive', onPress: () => backupNow(true).then(() => ok(), no) }]));
    }
  });
  const restore = () => Alert.alert('Serverdan tiklash',
    "Telefondagi joriy progress oxirgi zaxira bilan almashtiriladi va ilova qayta yuklanadi.",
    [{ text: 'Bekor', style: 'cancel' }, { text: 'Tiklash', style: 'destructive', onPress: () => run(restoreLatest) }]);
  return (
    <View style={{ gap: 8, marginTop: 6 }}>
      <T bold>💾 Zaxira</T>
      <T dim size={13}>Har kuni ilova ochilganda avtomatik saqlanadi (oxirgi 14 kun serverda).</T>
      {!!info && <T dim size={13}>{info}</T>}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button kind="ghost" label={busy ? '⏳...' : 'Hozir saqlash'} disabled={busy} onPress={save} /></View>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Tiklash" disabled={busy} onPress={restore} /></View>
      </View>
    </View>
  );
}

const input = {
  color: C.text, fontSize: 16, padding: 12, borderRadius: 12,
  backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder,
} as const;
