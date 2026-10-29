/**
 * Miya — o'yinlar ko'nikma bo'yicha guruhlangan: shaxmat, mantiq, xotira, ishchi xotira, diqqat, tezlik.
 * Har o'yinda o'z darajasi; pastda — statistika va AI tahlil.
 */

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { C } from '@/constants/theme';
import { GAMES } from '@/data/games';
import { BRAIN_SKILLS, getBrainLog, getChess, type BrainEntry } from '@/lib/brain';
import { FRIENDS } from '@/lib/edition';
import { Button, Card, Screen, T, Title } from '@/ui/kit';

export default function Brain() {
  const [log, setLog] = useState<BrainEntry[]>([]);
  const [rating, setRating] = useState(1000);
  // Ekranga qaytganda yangilanadi (o'yindan keyin daraja/ball ko'rinsin)
  useFocusEffect(useCallback(() => {
    getBrainLog().then(setLog);
    getChess().then((c) => setRating(c.rating));
  }, []));

  return (
    <Screen>
      <Title sub="Kuniga 10–15 daqiqa: shaxmat, mantiq, xotira, diqqat, tezlik.">Miya</Title>
      <Card style={{ gap: 4, borderColor: C.green }}>
        <T dim>♟️ Masala reytingi</T>
        <T size={28} bold>{rating}</T>
      </Card>
      {BRAIN_SKILLS.map((sk) => {
        const games = GAMES.filter((g) => g.skill === sk.id && !(FRIENDS && g.ai));
        if (!games.length) return null;
        return (
          <View key={sk.id} style={{ gap: 8 }}>
            <T bold size={17}>{sk.icon} {sk.title}</T>
            {games.map((g) => {
              const mine = log.filter((e) => e.game === g.id);
              const lastE = mine[mine.length - 1];
              const best = mine.reduce((m, e) => Math.max(m, e.score), 0);
              return (
                <Pressable key={g.id} onPress={() => router.push(`/game/${g.id}`)}>
                  <Card style={{ gap: 4 }}>
                    <T bold>{g.icon} {g.title}</T>
                    <T dim size={13}>{g.about}</T>
                    {lastE ? <T dim size={13}>Daraja {lastE.level} · oxirgi {lastE.score}% · eng yaxshi {best}% · {mine.length} marta</T> : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        );
      })}
      {!FRIENDS && <Button label="📊 Statistika va AI tahlil" onPress={() => router.push('/brain-report')} />}
    </Screen>
  );
}
