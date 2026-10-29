/**
 * chess.tsx — shaxmat masalalari (Lichess bazasi, CC0). Sessiya — 5 ta masala.
 *   • Masala reytingi o'yinchining masala-reytingiga yaqin tanlanadi (Elo kabi o'zgaradi).
 *   • Raqib birinchi yurishni qiladi, keyin siz yechimni topasiz; to'g'ri yurishdan keyin raqib javob beradi.
 *   • Xato bo'lsa — to'g'ri yurish ko'rsatiladi va "🤖 Nega?" bilan AI tushuntiradi.
 * Doska — oddiy View'lar va unicode donalar (qo'shimcha kutubxonasiz), qoidalar — chess.js.
 */

import { Chess, type Square } from 'chess.js';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import rows from '@/data/puzzles.json';
import { chessExplain, type ChessExplain } from '@/lib/ai';
import { chessResult, getChess } from '@/lib/brain';
import { Button, Card, T } from '@/ui/kit';
import type { GameProps } from './quick';

type Row = [string, string, string, number, string];
const PUZZLES = rows as unknown as Row[];
const SESSION = 5;
const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const FILES = 'abcdefgh';
const THEME_UZ: Record<string, string> = {
  fork: 'vilka (ikki tomonlama hujum)', pin: 'bog\'lash', skewer: 'skewer (orqadagi donaga hujum)', mateIn1: 'mat 1 yurishda',
  mateIn2: 'mat 2 yurishda', mateIn3: 'mat 3 yurishda', hangingPiece: 'himoyasiz dona', discoveredAttack: 'ochiq hujum',
  backRankMate: 'oxirgi qatorda mat', sacrifice: 'qurbonlik', deflection: 'chalg\'itish', attraction: 'jalb qilish',
  trappedPiece: 'qamalgan dona', promotion: 'piyodani farzinga aylantirish', endgame: 'endshpil', middlegame: 'o\'rta o\'yin',
  advantage: 'ustunlikka erishish', crushing: 'hal qiluvchi ustunlik', defensiveMove: 'himoya yurishi', quietMove: 'jim yurish',
  doubleCheck: 'qo\'sh shax', exposedKing: 'ochiq qirol', kingsideAttack: 'qirol qanotiga hujum', intermezzo: 'oraliq yurish',
};
export const themesUz = (t: string) => t.split(' ').map((x) => THEME_UZ[x]).filter(Boolean).slice(0, 3).join(', ');

/** Reytingga yaqin, hali ko'rilmagan masala. */
function pick(rating: number, seen: string[]): Row {
  for (const spread of [100, 200, 400, 2000]) {
    const pool = PUZZLES.filter((p) => Math.abs(p[3] - rating) <= spread && !seen.includes(p[0]));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

const uciMove = (u: string) => ({ from: u.slice(0, 2) as Square, to: u.slice(2, 4) as Square, promotion: u[4] ?? 'q' });

export function ChessPuzzles({ level, onDone }: GameProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [n, setN] = useState(0);
  const [solved, setSolved] = useState(0);
  const [fails, setFails] = useState<string[]>([]);

  useEffect(() => { getChess().then((st) => { setRating(st.rating); setSeen(st.seen); }); }, []);
  if (rating === null) return <T dim>Yuklanmoqda...</T>;
  if (!PUZZLES.length) return <T>Masalalar bazasi hali yuklanmagan.</T>;

  const done = async (ok: boolean, p: Row) => {
    const st = await chessResult(p[3], ok, p[0]);
    setRating(st.rating); setSeen(st.seen);
    const s2 = solved + (ok ? 1 : 0);
    const f2 = ok ? fails : [...fails, themesUz(p[4]) || 'taktika'];
    setSolved(s2); setFails(f2);
    if (n + 1 >= SESSION) onDone((s2 / SESSION) * 100, f2);
    else setN(n + 1);
  };
  return (
    <View style={{ gap: 10 }}>
      <T dim>Masala {n + 1}/{SESSION} · Sizning masala reytingingiz: {rating} · daraja {level}</T>
      <Puzzle key={`${n}-${seen.length}`} row={pick(rating, seen)} onFinish={done} />
    </View>
  );
}

function Puzzle({ row, onFinish }: { row: Row; onFinish: (ok: boolean, p: Row) => void }) {
  const [id, fen, movesStr, prating, themes] = row;
  const moves = useMemo(() => movesStr.split(' '), [movesStr]);
  const game = useMemo(() => new Chess(fen), [fen]);
  const [board, setBoard] = useState(() => game.board());
  const [ply, setPly] = useState(0);                   // nechanchi yurish navbati (moves indeksi)
  const [sel, setSel] = useState<Square | null>(null);
  const [state, setState] = useState<'play' | 'ok' | 'fail'>('play');
  const [last, setLast] = useState<[string, string] | null>(null);
  const [wrongSan, setWrongSan] = useState('');
  const [fenBefore, setFenBefore] = useState('');
  const [ai, setAi] = useState<ChessExplain | null>(null);
  const [aiErr, setAiErr] = useState('');
  const [busy, setBusy] = useState(false);
  const me = useMemo(() => (new Chess(fen).turn() === 'w' ? 'b' : 'w'), [fen]);   // raqib birinchi yuradi

  const apply = (u: string) => {
    game.move(uciMove(u));
    setBoard(game.board());
    setLast([u.slice(0, 2), u.slice(2, 4)]);
  };
  // 1) raqibning birinchi yurishi
  useEffect(() => {
    const t = setTimeout(() => { apply(moves[0]); setPly(1); }, 700);
    return () => clearTimeout(t);
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (sq: Square) => {
    if (state !== 'play' || ply % 2 === 0) return;
    const piece = game.get(sq);
    if (!sel || (piece && piece.color === me)) { if (piece && piece.color === me) setSel(sq); return; }
    const uci = `${sel}${sq}`;
    setSel(null);
    const legal = game.moves({ verbose: true }).find((m) => m.from === sel && m.to === sq);
    if (!legal) return;
    const want = moves[ply];
    const before = game.fen();
    const isMate = (() => { const g = new Chess(before); g.move(uciMove(uci + (want[4] ?? ''))); return g.isCheckmate(); })();
    if (uci === want.slice(0, 4) || isMate) {
      apply(uci + (want[4] ?? ''));
      if (isMate || ply + 1 >= moves.length) { setState('ok'); return; }
      setPly(ply + 2);
      setTimeout(() => apply(moves[ply + 1]), 500);       // raqib javobi
    } else {
      setWrongSan(legal.san); setFenBefore(before);
      setState('fail');
      setTimeout(() => { apply(want); }, 400);              // to'g'ri yurishni ko'rsatamiz
    }
  };

  const explain = async () => {
    setBusy(true); setAiErr('');
    try {
      const g = new Chess(fenBefore);
      const line = moves.slice(ply).map((u) => g.move(uciMove(u)).san);
      setAi(await chessExplain({ fen: fenBefore, wrong: wrongSan, best: line, themes, rating: prating }));
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const flip = me === 'b';
  const size = 42;
  return (
    <View style={{ gap: 10 }}>
      <T bold>{me === 'w' ? '⚪ Oqlar' : '⚫ Qoralar'} yuradi · reyting {prating}</T>
      <View style={{ alignSelf: 'center', borderWidth: 2, borderColor: C.cardBorder }}>
        {[...Array(8).keys()].map((r0) => {
          const r = flip ? 7 - r0 : r0;
          return (
            <View key={r} style={{ flexDirection: 'row' }}>
              {[...Array(8).keys()].map((c0) => {
                const c = flip ? 7 - c0 : c0;
                const sq = `${FILES[c]}${8 - r}` as Square;
                const p = board[r][c];
                const light = (r + c) % 2 === 0;
                const hl = sel === sq ? C.green : last && (last[0] === sq || last[1] === sq) ? 'rgba(251,191,36,0.55)' : undefined;
                return (
                  <Pressable key={c} onPress={() => tap(sq)} style={{
                    width: size, height: size, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: hl ?? (light ? '#E8EDE9' : '#6E8F7E'),
                  }}>
                    {p && <Text style={{ fontSize: 32, lineHeight: 38, color: p.color === 'w' ? '#FFFFFF' : '#111111',
                      textShadowColor: p.color === 'w' ? '#000' : '#fff', textShadowRadius: 1.5 }}>{GLYPH[p.type]}</Text>}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
      {state === 'play' && <T dim>Eng kuchli yurishni toping. Donani bosing, keyin katakni.</T>}
      {state === 'ok' && (
        <Card style={{ gap: 6, borderColor: C.green }}>
          <T bold color={C.green}>✓ To'g'ri!</T>
          <T dim size={13}>Mavzu: {themesUz(themes) || 'taktika'}</T>
          <Button label="Keyingi masala" onPress={() => onFinish(true, row)} />
        </Card>
      )}
      {state === 'fail' && (
        <Card style={{ gap: 6, borderColor: C.red }}>
          <T bold color={C.red}>✗ {wrongSan} — bu yechim emas. To'g'ri yurish doskada ko'rsatildi.</T>
          <T dim size={13}>Mavzu: {themesUz(themes) || 'taktika'}</T>
          {!ai && <Button kind="ghost" label={busy ? '⏳ AI tahlil qilmoqda...' : '🤖 Nega? (AI tahlil)'} disabled={busy} onPress={explain} />}
          {!!aiErr && <T color={C.red} size={13}>{aiErr}</T>}
          {ai && (
            <View style={{ gap: 4 }}>
              <T size={14}>❌ {ai.why_wrong_uz}</T>
              <T size={14}>✅ {ai.idea_uz}</T>
              <T size={14}>💡 {ai.tip_uz}</T>
            </View>
          )}
          <Button label="Keyingi masala" onPress={() => onFinish(false, row)} />
        </Card>
      )}
      <T dim size={11}>Masala #{id} · lichess.org (CC0)</T>
    </View>
  );
}
