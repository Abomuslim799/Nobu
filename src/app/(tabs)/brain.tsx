/**
 * Miya — Lumosity uslubidagi mashqlar ro'yxati.
 */

import { router } from 'expo-router';

import { GAMES } from '@/data/games';
import { useProgress } from '@/lib/progress';
import { Button, Card, Screen, T, Title } from '@/ui/kit';

export default function Brain() {
  const { data } = useProgress();
  return (
    <Screen>
      <Title sub="Kuniga 1–2 daqiqa — tezlik, xotira, diqqat.">Miya mashqlari</Title>
      {GAMES.map((g) => {
        const stats = data.games[g.id];
        return (
          <Card key={g.id} style={!g.ready ? { opacity: 0.5 } : undefined}>
            <T size={18} bold>{g.icon} {g.title}</T>
            <T dim size={13}>{g.skill}</T>
            <T>{g.about}</T>
            {stats ? <T dim size={13}>Rekord: {stats.best} · O'yinlar: {stats.plays}</T> : null}
            {g.ready
              ? <Button label="O'ynash" onPress={() => router.push(`/game/${g.id}`)} />
              : <T dim>Tez orada</T>}
          </Card>
        );
      })}
    </Screen>
  );
}
