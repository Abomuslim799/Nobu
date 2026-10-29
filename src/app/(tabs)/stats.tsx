/**
 * Statistika — umumiy natijalar, oxirgi 14 kun grafigi, yo'nalishlar bo'yicha.
 */

import { useEffect, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { C } from '@/constants/theme';
import { TRACKS } from '@/data/tracks';
import { useProgress } from '@/lib/progress';
import { pickBackup, exportBackup } from '@/lib/backup';
import { FRIENDS, IS_WEB } from '@/lib/edition';
import { lastDays } from '@/lib/streak';
import { getConfig, saveConfig, testConnection } from '@/lib/sync';
import { Bar, Button, Card, Screen, T, Title } from '@/ui/kit';

export default function Stats() {
  const { data, streak, best, reset, setReadGoal, exportJSON, importJSON } = useProgress();
  const readTotal = data.sessions.reduce((a, x) => a + x.minutes, 0);

  const restore = async () => {
    try {
      const raw = await pickBackup();
      if (raw === null) return;
      Alert.alert('Zaxirani tiklash', 'Hozirgi natijalar fayldagisi bilan almashtiriladi.', [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Tiklash', onPress: () => Alert.alert(importJSON(raw) ? 'Tiklandi ✓' : 'Fayl Nobu zaxirasi emas') },
      ]);
    } catch (e) {
      Alert.alert('Xato', String(e));
    }
  };
  const results = Object.values(data.lessons);
  const correct = results.reduce((sum, r) => sum + r.correct, 0);
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const days = lastDays(14);
  const maxXp = Math.max(10, ...days.map((d) => data.days[d]?.xp ?? 0));

  return (
    <Screen>
      <Title>Statistika</Title>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Seriya" value={`${streak}🔥`} />
        <Stat label="Rekord" value={`${best}`} />
        <Stat label="Aniqlik" value={total ? `${Math.round((correct / total) * 100)}%` : '—'} />
      </View>

      <Card>
        <T dim>Oxirgi 14 kun · XP</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {days.map((d) => {
            const xp = data.days[d]?.xp ?? 0;
            return (
              <View key={d} style={{ flex: 1, height: `${Math.max(3, (xp / maxXp) * 100)}%`,
                borderRadius: 4, backgroundColor: xp ? C.green : 'rgba(255,255,255,0.08)' }} />
            );
          })}
        </View>
      </Card>

      {!FRIENDS && <Card>
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
      </Card>}

      {!FRIENDS && <Card style={{ gap: 8 }}>
        <T dim>Kitob o'qish · jami {readTotal} daqiqa, {data.books.length} kitob</T>
        <T>Kunlik maqsad: {data.settings.readGoal} daqiqa</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[10, 20, 30, 45, 60].map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <Button kind={data.settings.readGoal === m ? 'primary' : 'ghost'} label={`${m}`} onPress={() => setReadGoal(m)} />
            </View>
          ))}
        </View>
      </Card>}

      {!FRIENDS && <ServerLink />}

      {!IS_WEB && <Card style={{ gap: 8 }}>
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
      <T bold>🔗 Widget uchun server</T>
      <T dim size={13}>Day streak serverga yuboriladi — iPhone widgetida ko'rinadi.</T>
      <TextInput style={input} placeholder="https://....up.railway.app" placeholderTextColor={C.dim}
        value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <TextInput style={input} placeholder="APP_TOKEN" placeholderTextColor={C.dim}
        value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} secureTextEntry />
      <Button label="Saqlash va tekshirish" onPress={save} />
      {!!status && <T dim size={13}>{status}</T>}
    </Card>
  );
}

const input = {
  color: C.text, fontSize: 16, padding: 12, borderRadius: 12,
  backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder,
} as const;
