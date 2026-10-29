/**
 * game/[id].tsx — bitta miya o'yini: kirish (daraja) → o'yin → natija.
 * Natija lib/brain.ts jurnaliga yoziladi va daraja moslashadi (≥80% — oshadi, <50% — pasayadi).
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { GAMES } from '@/data/games';
import { ChessPuzzles } from '@/games/chess';
import { LogicAI, MemoryGrid, NBack, Reaction, Sequence, SpeedMath, Stroop, Sudoku, type GameProps } from '@/games/quick';
import { finishGame, getLevel } from '@/lib/brain';
import { useProgress } from '@/lib/progress';
import { Button, Card, T } from '@/ui/kit';

const COMPONENTS: Record<string, (p: GameProps) => ReactNode> = {
  chess: ChessPuzzles, sequence: Sequence, sudoku: Sudoku, 'logic-ai': LogicAI, 'memory-grid': MemoryGrid,
  'n-back': NBack, stroop: Stroop, 'speed-math': SpeedMath, reaction: Reaction,
};

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === id);
  const { recordGame } = useProgress();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [result, setResult] = useState<{ score: number; next: number; mistakes: string[] } | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => { if (game) getLevel(game.id).then(setLevel); }, [game]);

  const onDone = useCallback(async (raw: number, mistakes: string[]) => {
    if (!game) return;
    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const next = await finishGame(game.skill, game.id, score, level, mistakes);
    recordGame(game.id, score);                 // streak va kunlik faollik uchun
    setResult({ score, next, mistakes });
    setPhase('done');
  }, [game, level, recordGame]);

  if (!game) return <View style={s.root}><T>O'yin topilmadi</T></View>;
  const Game = COMPONENTS[game.id];

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <T bold style={{ flex: 1 }}>{game.icon} {game.title}</T>
        <T dim>daraja {level}</T>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        {phase === 'intro' && (
          <View style={{ gap: 14 }}>
            <Text style={{ fontSize: 60, textAlign: 'center' }}>{game.icon}</Text>
            <T size={24} bold style={{ textAlign: 'center' }}>{game.title}</T>
            <T dim style={{ textAlign: 'center' }}>{game.about}</T>
            <T dim style={{ textAlign: 'center' }}>Daraja: {level} · 80%+ — oshadi, 50% dan past — pasayadi</T>
            <Button label="Boshlash" onPress={() => { setRound((r) => r + 1); setPhase('play'); }} />
          </View>
        )}
        {phase === 'play' && <Game key={round} level={level} onDone={onDone} />}
        {phase === 'done' && result && (
          <View style={{ gap: 12 }}>
            <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
              <Text style={{ fontSize: 48 }}>{result.score >= 80 ? '🏆' : result.score >= 50 ? '👍' : '💪'}</Text>
              <T size={32} bold>{result.score}%</T>
              <T dim>
                {result.next > level ? `Daraja oshdi: ${level} → ${result.next}` : result.next < level ? `Daraja pasaydi: ${level} → ${result.next}` : `Daraja: ${level}`}
              </T>
            </Card>
            {result.mistakes.length > 0 && (
              <Card style={{ gap: 4 }}>
                <T bold>Xatolar / izoh</T>
                {result.mistakes.map((m, i) => <T key={i} size={14}>• {m}</T>)}
              </Card>
            )}
            <Button label="Yana bir bor" onPress={() => { setLevel(result.next); setRound((r) => r + 1); setPhase('play'); }} />
            <Button kind="ghost" label="Tugatish" onPress={() => router.back()} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  body: { padding: PAD, gap: 14, paddingBottom: 60 },
});
