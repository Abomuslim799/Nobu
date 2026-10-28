/**
 * game/[id].tsx — miya mashqlari. Hozircha "Tezkor hisob" (speed-math).
 *
 * Qoidalar: 60 soniya. Har to'g'ri javob +1 ball, qiyinlik ball bilan oshadi.
 * Xato javob — 3 soniya jarima (vaqt kamayadi). Natija statistikaga yoziladi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, PAD } from '@/constants/theme';
import { GAMES } from '@/data/games';
import { makeProblem, type Problem } from '@/lib/speed-math';
import { useProgress } from '@/lib/progress';
import { Bar, Button, Card, T } from '@/ui/kit';

const SECONDS = 60;
const PENALTY = 3;

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === id);
  const { data, recordGame } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(0));
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const saved = useRef(false);
  const insets = useSafeAreaInsets();
  const safe = { paddingTop: insets.top, paddingBottom: insets.bottom };

  // Taymer: har 100 ms da vaqtni kamaytiramiz (silliq progress chizig'i uchun).
  useEffect(() => {
    if (phase !== 'play') return;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(timer);                  // ekrandan chiqilsa — to'xtaydi
  }, [phase]);

  // Vaqt tugadi → natijani BIR MARTA saqlaymiz (useRef qayta saqlashdan himoya qiladi).
  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) {
      setPhase('done');
      if (!saved.current && game) {
        saved.current = true;
        recordGame(game.id, score);
      }
    }
  }, [timeLeft, phase, score, game, recordGame]);

  if (!game?.ready) {
    return (
      <View style={[s.root, s.center, safe]}>
        <T>Bu mashq hali tayyor emas.</T>
        <Button label="Orqaga" onPress={() => router.back()} />
      </View>
    );
  }

  const answer = (value: number) => {
    const ok = value === problem.answer;
    setFlash(ok ? 'ok' : 'bad');
    setTimeout(() => setFlash(null), 150);
    if (ok) {
      setScore((sc) => sc + 1);
      setProblem(makeProblem(score + 1));
    } else {
      setTimeLeft((t) => Math.max(0, t - PENALTY));
    }
  };

  const start = () => {
    saved.current = false;
    setScore(0);
    setTimeLeft(SECONDS);
    setProblem(makeProblem(0));
    setPhase('play');
  };

  const best = data.games[game.id]?.best ?? 0;

  return (
    <View style={[s.root, safe]}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={22}>✕</T></Pressable>
        <View style={{ flex: 1 }}>
          <Bar value={timeLeft / SECONDS} color={timeLeft < 10 ? C.red : C.green} />
        </View>
        <T bold>{Math.ceil(timeLeft)}s</T>
      </View>

      {phase === 'intro' && (
        <View style={s.center}>
          <Text style={{ fontSize: 60, textAlign: 'center' }}>{game.icon}</Text>
          <T size={26} bold>{game.title}</T>
          <T dim>{game.about}</T>
          <T dim>Rekord: {best}</T>
          <Button label="Boshlash" onPress={start} />
        </View>
      )}

      {phase === 'play' && (
        <View style={s.center}>
          <T dim>Ball: {score}</T>
          <Text style={[s.problem, flash === 'ok' && { color: C.green }, flash === 'bad' && { color: C.red }]}>
            {problem.text}
          </Text>
          <View style={s.grid}>
            {problem.options.map((o) => (
              <Pressable key={o} onPress={() => answer(o)}
                style={({ pressed }) => [s.answer, pressed && { backgroundColor: C.greenSoft }]}>
                <Text style={s.answerText}>{o}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'done' && (
        <View style={s.center}>
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ fontSize: 52 }}>{score > best ? '🏆' : '⚡'}</Text>
            <T size={30} bold>{score} ball</T>
            <T dim>{score >= best && score > 0 ? 'Yangi rekord!' : `Rekord: ${best}`}</T>
          </Card>
          <Button label="Yana bir bor" onPress={start} />
          <Button kind="ghost" label="Tugatish" onPress={() => router.back()} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  center: { flex: 1, padding: PAD, gap: 14, justifyContent: 'center' },
  problem: { color: C.text, fontSize: 56, fontWeight: '800', textAlign: 'center', marginVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  answer: { width: '47%', flexGrow: 1, paddingVertical: 22, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  answerText: { color: C.text, fontSize: 26, fontWeight: '700' },
});
