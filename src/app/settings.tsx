/**
 * settings.tsx — barcha sozlamalar bir joyda (Bosh sahifa → ⋮):
 *   ovoz (tezlik, telefonga saqlash / bazani yangilash), o'qish maqsadi, ko'rinish, server, zaxira, tozalash.
 */

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { exportBackup, pickBackup } from '@/core/backup';
import { C } from '@/core/theme';
import { Bar, Button, Card, Screen, T, Title } from '@/core/ui/kit';
import { SCOPES, clearAudio, compare, syncAudio, usage, type Scope, type SyncState } from '@/features/english/audioCache';
import { RATES, useRate } from '@/features/english/speak';
import { ServerLink, ThemePick } from '@/features/settings/parts';
import { useProgress } from '@/store';

export default function Settings() {
  const { data, reset, setReadGoal, exportJSON, importJSON } = useProgress();

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

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>‹</T></Pressable>
        <View style={{ flex: 1 }}><Title>Sozlamalar</Title></View>
      </View>

      <AudioBox />

      <Card style={{ gap: 8 }}>
        <T bold>📚 Kitob o'qish</T>
        <T dim size={13}>Kunlik maqsad: {data.settings.readGoal} daqiqa</T>
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
        <T bold>💾 Zaxira fayli</T>
        <T dim size={13}>Haftada bir marta faylni Telegram yoki iCloud'ga saqlab qo'ying.</T>
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

/** 🔊 Ovoz: tezlik + ovozlarni telefonga saqlash (bazani server bilan solishtirib yangilash). */
function AudioBox() {
  const [rate, setRate] = useRate();
  const [scope, setScope] = useState<Scope>('examples');
  const [info, setInfo] = useState<{ missing: number; changed: number; total: number; online: boolean } | null>(null);
  const [st, setSt] = useState<SyncState | null>(null);
  const [disk, setDisk] = useState(() => usage());
  const stop = useRef(false);

  useEffect(() => {
    let alive = true;
    compare(scope).then((c) => { if (alive) setInfo({ missing: c.missing.length, changed: c.changed.length, total: c.need.length, online: c.online }); });
    return () => { alive = false; };
  }, [scope, st?.running]);

  const run = async () => {
    stop.current = false;
    const r = await syncAudio(scope, setSt, () => stop.current);
    setDisk(usage());
    Alert.alert(r.failed ? 'Qisman yangilandi' : 'Baza yangilandi ✓',
      r.failed ? `${r.done - r.failed} ta yuklandi, ${r.failed} ta yuklanmadi — internetni tekshirib, qayta bosing.` : `${r.done} ta fayl yuklandi.`);
  };

  const sel = SCOPES.find((x) => x.id === scope)!;
  const todo = info ? info.missing + info.changed : 0;
  const running = !!st?.running;

  return (
    <Card style={{ gap: 10 }}>
      <T bold>🔊 Ovoz</T>
      <T dim size={13}>Tezlik</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {RATES.map((r) => (
          <View key={r} style={{ flex: 1 }}>
            <Button kind={rate === r ? 'primary' : 'ghost'} label={`${r}×`} onPress={() => setRate(r)} />
          </View>
        ))}
      </View>

      <T dim size={13}>Telefonga saqlash — ovoz internetsiz, darhol chalinadi</T>
      {SCOPES.map((x) => (
        <Pressable key={x.id} disabled={running} onPress={() => setScope(x.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: scope === x.id ? C.green : C.cardBorder }}>
          <T size={16}>{scope === x.id ? '●' : '○'}</T>
          <View style={{ flex: 1 }}>
            <T bold size={15}>{x.label}</T>
            <T dim size={12}>{x.sub}</T>
          </View>
        </Pressable>
      ))}

      {info ? (
        <T size={13}>
          {info.total - info.missing}/{info.total} telefonda
          {todo ? ` · ${info.missing} ta yetishmaydi${info.changed ? `, ${info.changed} ta eskirgan` : ''} (~${Math.ceil((todo * sel.avgKB) / 1024)} MB)` : ' · ✅ hammasi bor'}
          {!info.online ? ' · server bilan aloqa yo\'q' : ''}
        </T>
      ) : <T dim size={13}>Solishtirilmoqda…</T>}

      {running && st && (
        <View style={{ gap: 6 }}>
          <Bar value={st.todo ? st.done / st.todo : 1} />
          <T dim size={12}>{st.done}/{st.todo} yuklandi{st.failed ? ` · ${st.failed} xato` : ''}</T>
          <Button kind="ghost" label="To'xtatish" onPress={() => { stop.current = true; }} />
        </View>
      )}
      {!running && <Button label={todo ? `🔄 Bazani yangilash (${todo} ta)` : '🔄 Qayta tekshirish'} disabled={!info}
        onPress={todo ? run : () => setSt(null)} />}

      <T dim size={12}>Telefonda: {disk.count} ta fayl, {disk.mb.toFixed(1)} MB. Wi-Fi'da yangilash tavsiya etiladi.</T>
      {disk.count > 0 && !running && (
        <Button kind="ghost" label="Ovozlarni telefondan o'chirish" onPress={() => Alert.alert("O'chirish", 'Saqlangan ovozlar o\'chiriladi (keyin qayta yuklash mumkin).', [
          { text: 'Bekor', style: 'cancel' },
          { text: "O'chirish", style: 'destructive', onPress: () => { clearAudio().then(() => { setDisk(usage()); setSt(null); }); } },
        ])} />
      )}
    </Card>
  );
}
