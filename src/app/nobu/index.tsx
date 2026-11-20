/**
 * Statistika — umumiy natijalar, oxirgi 14 kun grafigi, yo'nalishlar bo'yicha.
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, DevSettings, Platform, Pressable, TextInput, View } from 'react-native';

import { C } from '@/core/theme';
import { TRACKS } from '@/features/it/tracks';
import { useRating , useProgress } from '@/store';
import { pickBackup, exportBackup , backupNow, lastBackup, restoreLatest } from '@/core/backup';
import { lastDays } from '@/core/date';
import { getConfig, saveConfig, testConnection } from '@/core/server';
import { THEMES, THEME_ID, setTheme } from '@/core/theme';
import * as Updates from 'expo-updates';
import { Bar, Button, Card, Screen, T, Title } from '@/core/ui/kit';

export default function Stats() {
  const { data, reset, setReadGoal, exportJSON, importJSON } = useProgress();
  const { streak, best, fr, rank, m: rating } = useRating();
  const readTotal = data.sessions.reduce((a, x) => a + x.minutes, 0);

  const restore = async () => {
    try {
      const raw = await pickBackup();
      if (raw === null) return;
      Alert.alert('Zaxirani tiklash', 'Hozirgi natijalar fayldagisi bilan almashtiriladi.', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Tiklash', onPress: () => Alert.alert(importJSON(raw) ? 'Tiklandi ✓' : 'Fayl Farobiy zaxirasi emas') },
      ]);
    } catch (e) {
      Alert.alert('Xato', String(e));
    }
  };
  const days = lastDays(14);
  const maxXp = Math.max(10, ...days.map((d) => Math.floor((rating.sec[d] ?? 0) / 60)));

  return (
    <Screen>
      <Title sub="Shaxsiy yordamchingiz: natijalar, tahlil, sozlamalar">Nobu</Title>
      <Button label="🤖 Nobu tahlili — barcha bo'limlar" onPress={() => router.push('/nobu/report')} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Seriya" value={`${streak}🔥`} />
        <Stat label="Rekord" value={`${best}`} />
        <Stat label={rank.title} value={`${fr}`} />
      </View>

      <Card>
        <T dim>Oxirgi 14 kun · faol daqiqa</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {days.map((d) => {
            const xp = Math.floor((rating.sec[d] ?? 0) / 60);
            return (
              <View key={d} style={{ flex: 1, height: `${Math.max(3, (xp / maxXp) * 100)}%`,
                borderRadius: 4, backgroundColor: xp ? C.green : C.subtle2 }} />
            );
          })}
        </View>
      </Card>

      <Card>
        <T dim>Yo'nalishlar</T>
        {TRACKS.map((t) => {
          const done = t.lessons.filter((l) => data.lessons[l.id]).length;
          return (
            <View key={t.id} style={{ gap: 4, marginTop: 6 }}>
              <T>{t.icon} {t.title} · {done}/{t.lessons.length}</T>
              <Bar value={done / t.lessons.length} color={t.color} />
            </View>
          );
        })}
      </Card>

      <Card style={{ gap: 8 }}>
        <T dim>Kitob o'qish · jami {readTotal} daqiqa, {data.books.length} kitob</T>
        <T>Kunlik maqsad: {data.settings.readGoal} daqiqa</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[10, 20, 30, 45, 60].map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <Button kind={data.settings.readGoal === m ? 'primary' : 'ghost'} label={`${m}`} onPress={() => setReadGoal(m)} />
            </View>
          ))}
        </View>
      </Card>

      <ThemePick />
      <ServerLink />

      {Platform.OS !== 'web' && <Card style={{ gap: 8 }}>
        <T bold>💾 Zaxira</T>
        <T dim size={13}>Natijalar faqat shu telefonda. Haftada bir marta faylni Telegram yoki iCloud'ga saqlab qo'ying.</T>
        <Button label="Zaxira faylini yuborish" onPress={() => exportBackup(exportJSON()).catch((e) => Alert.alert('Xato', String(e)))} />
        <Button kind="ghost" label="Fayldan tiklash" onPress={restore} />
      </Card>}

      <Button kind="ghost" label="Natijalarni tozalash"
        onPress={() => Alert.alert('Tozalash', "Barcha natijalar o'chiriladi.", [
          { text: 'Bekor', style: 'cancel' },
          { text: "O'chirish", style: 'destructive', onPress: reset },
        ])} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <T size={24} bold>{value}</T>
      <T dim size={13}>{label}</T>
    </Card>
  );
}

/** 🎨 Ko'rinish: mavzu tanlash — ilova yangi ranglar bilan qayta ochiladi. */
function ThemePick() {
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
function ServerLink() {
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
