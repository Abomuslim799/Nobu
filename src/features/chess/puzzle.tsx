/**
 * puzzle.tsx — bitta masala: raqib birinchi yuradi, siz yechimni topasiz.
 * To'g'ri yurish — ★ Best move, noto'g'ri — ✗ Miss (yurish ko'rsatiladi, keyin qaytarilib to'g'risi o'ynaladi).
 * Tugagach ‹ › bilan yurishlarni qayta ko'rish; xato bo'lsa — "🤖 Nega?" (AI tushuntiradi).
 */

import { Chess, type Square } from 'chess.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { C } from '@/core/theme';
import { Button, T } from '@/core/ui/kit';
import { chessExplain, type ChessExplain } from '@/features/brain/ai';
import { ChessBoard, type Badge } from '@/features/chess/board';
import { useLook } from '@/features/chess/look';
import { themesUz, type Row } from '@/features/chess/puzzles';
import { moveSound, playSound } from '@/features/chess/sound';

type Frame = { fen: string; last: [Square, Square] | null; badge: Badge | null };
const uci = (u: string) => ({ from: u.slice(0, 2) as Square, to: u.slice(2, 4) as Square, promotion: u[4] });
export const GOOD = '#5B9E2E', BAD = '#D64545';

export function PuzzleView({ row, sprint = false, onFinish }: { row: Row; sprint?: boolean; onFinish: (ok: boolean) => void }) {
  const [id, fen0, movesStr, prating, themes] = row;
  const moves = useMemo(() => movesStr.split(' '), [movesStr]);
  const look = useLook();
  const game = useRef(new Chess(fen0));
  const [hist, setHist] = useState<Frame[]>([{ fen: fen0, last: null, badge: null }]);
  const [view, setView] = useState<number | null>(null);
  const [ply, setPly] = useState(0);
  const [state, setState] = useState<'play' | 'ok' | 'fail'>('play');
  const [pen, setPen] = useState(false);
  const [wrong, setWrong] = useState<{ san: string; fen: string } | null>(null);
  const [ai, setAi] = useState<ChessExplain | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  const me = useMemo(() => (new Chess(fen0).turn() === 'w' ? 'b' : 'w'), [fen0]);

  const push = (u: string, badge: Badge | null = null) => {
    const m = game.current.move(uci(u));
    playSound(moveSound(m), look.sound);
    setHist((h) => [...h, { fen: game.current.fen(), last: [m.from, m.to], badge }]);
    return m;
  };
  useEffect(() => {
    later(600, () => { push(moves[0]); setPly(1); });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const finish = (ok: boolean) => {
    setState(ok ? 'ok' : 'fail');
    later(150, () => playSound(ok ? 'good' : 'bad', look.sound));
    if (sprint) later(ok ? 500 : 1300, () => onFinish(ok));
  };

  const onMove = (from: Square, to: Square) => {
    if (state !== 'play' || ply % 2 === 0 || view !== null) return;
    const want = moves[ply];
    const g = game.current, before = g.fen();
    const legal = g.moves({ verbose: true }).find((m) => m.from === from && m.to === to);
    if (!legal) return;
    const mine = `${from}${to}${legal.promotion ? (want.slice(0, 4) === `${from}${to}` ? want[4] ?? 'q' : 'q') : ''}`;
    const test = new Chess(before); test.move(uci(mine));
    if (mine.slice(0, 4) === want.slice(0, 4) || test.isCheckmate()) {
      push(mine, { sq: to, text: '★', color: GOOD });
      if (test.isCheckmate() || ply + 1 >= moves.length) return finish(true);
      setPly(ply + 2);
      later(450, () => push(moves[ply + 1]));
    } else {
      const m = push(mine, { sq: to, text: '✗', color: BAD });
      setWrong({ san: m.san, fen: before });
      setState('fail');
      playSound('bad', look.sound);
      later(900, () => {                                  // xatoni qaytarib, to'g'ri yurishni ko'rsatamiz
        g.undo();
        setHist((h) => h.slice(0, -1));
        later(50, () => push(want, { sq: want.slice(2, 4) as Square, text: '★', color: GOOD }));
        if (sprint) later(1300, () => onFinish(false));
      });
    }
  };

  const explain = async () => {
    if (!wrong) return;
    setAiBusy(true); setAiErr('');
    try {
      const g = new Chess(wrong.fen);
      const line = moves.slice(ply).map((u) => g.move(uci(u)).san);
      setAi(await chessExplain({ fen: wrong.fen, wrong: wrong.san, best: line, themes, rating: prating }));
    } catch (e) { setAiErr(e instanceof Error ? e.message : String(e)); } finally { setAiBusy(false); }
  };

  const idx = view ?? hist.length - 1;
  const fr = hist[Math.min(idx, hist.length - 1)];
  const done = state !== 'play';
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: me === 'w' ? '#F4F1EA' : '#222', borderWidth: 1, borderColor: C.dim }} />
        <T bold style={{ flex: 1 }}>{me === 'w' ? 'Oqlar' : 'Qoralar'} yuradi{sprint ? '' : ` · ${prating}`}</T>
        <Pressable onPress={() => setPen(!pen)} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: pen ? C.gold : C.subtle }}>
          <T size={14} color={pen ? '#2A1E0A' : C.text}>✏️ Reja</T>
        </Pressable>
      </View>
      <ChessBoard fen={fr.fen} orientation={me} movable={!done && view === null ? me : null} lastMove={fr.last} badge={fr.badge}
        onMove={onMove} pen={pen} clearKey={hist.length} />

      {!sprint && done && hist.length > 2 && (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          {[['⏮', 1], ['‹', Math.max(1, idx - 1)], ['›', Math.min(hist.length - 1, idx + 1)], ['⏭', hist.length - 1]].map(([l, to]) => (
            <Pressable key={l as string} onPress={() => setView((to as number) >= hist.length - 1 ? null : (to as number))}
              style={{ width: 54, height: 40, borderRadius: 10, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' }}>
              <T size={18}>{l as string}</T>
            </Pressable>
          ))}
        </View>
      )}

      {state === 'play' && <T dim size={13}>{ply % 2 === 1 ? "Eng kuchli yurishni toping. Bosib turib sudrasangiz — strelka (reja)." : '…'}</T>}
      {state === 'ok' && !sprint && <T bold color={GOOD}>★ Best move — yechildi! · {themesUz(themes) || 'taktika'}</T>}
      {state === 'fail' && !sprint && (
        <View style={{ gap: 6 }}>
          <T bold color={BAD}>✗ Miss — {wrong?.san} yechim emas. To'g'ri yurish ko'rsatildi.</T>
          <T dim size={13}>Mavzu: {themesUz(themes) || 'taktika'}</T>
          {!ai && <Button kind="ghost" label={aiBusy ? '⏳ AI tahlil qilmoqda...' : '🤖 Nega?'} disabled={aiBusy} onPress={explain} />}
          {!!aiErr && <T color={C.red} size={13}>{aiErr}</T>}
          {ai && <View style={{ gap: 4 }}><T size={14}>❌ {ai.why_wrong_uz}</T><T size={14}>✅ {ai.idea_uz}</T><T size={14}>💡 {ai.tip_uz}</T></View>}
        </View>
      )}
      {done && !sprint && <Button label="Keyingi masala ›" onPress={() => onFinish(state === 'ok')} />}
      {!sprint && <T dim size={11}>Masala #{id} · lichess.org (CC0)</T>}
    </View>
  );
}
