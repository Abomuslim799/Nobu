/**
 * board.tsx — shaxmat doskasi: tema va dona to'plami (look.ts), yurish — bosish yoki sudrash,
 * minimal effektlar (0.12 s sirg'alish, olingan dona so'nishi, oxirgi yurish rangi, shaxda qizil nur).
 * Reja chizish (chess.com'dagi o'ng tugma o'rniga): bosib turib sudrash — strelka, bosib turish — aylana.
 * Qayta chizilsa rang almashadi (yashil → qizil → sariq → o'chadi). Strelkalar raqamlanadi; yurishdan keyin o'chadi.
 * ✏️ (pen) yoqilsa — oddiy sudrash ham strelka chizadi.
 */

import { Chess, type Square } from 'chess.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { boardOf, useLook } from '@/features/chess/look';
import { PIECE_IMG } from '@/features/chess/pieces';

const FILES = 'abcdefgh';
const MARK = ['rgba(21,120,27,0.8)', 'rgba(200,40,40,0.8)', 'rgba(230,170,20,0.85)'];   // yashil, qizil, sariq
const LONG_MS = 300, MOVE_PX = 8, SLIDE_MS = 120;

export interface Badge { sq: Square; text: string; color: string }
type Arrow = { from: Square; to: Square; c: number };
type Mark = { sq: Square; c: number };

export function ChessBoard({ fen, orientation, movable = null, lastMove = null, onMove, badge = null, pen = false, clearKey, onBusy }: {
  fen: string; orientation: 'w' | 'b'; movable?: 'w' | 'b' | null; lastMove?: [Square, Square] | null;
  onMove?: (from: Square, to: Square) => void; badge?: Badge | null; pen?: boolean; clearKey?: unknown;
  onBusy?: (busy: boolean) => void;   // barmoq doskada — ota ScrollView aylanmasin
}) {
  const look = useLook();
  const th = boardOf(look);
  const imgs = PIECE_IMG[look.pieces] ?? PIECE_IMG.klassik;
  const [W, setW] = useState(0);
  const S = W / 8;
  const game = useMemo(() => { try { return new Chess(fen); } catch { return new Chess(); } }, [fen]);
  const board = useMemo(() => game.board(), [game]);
  const [sel, setSel] = useState<Square | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [preview, setPreview] = useState<{ from: Square; to: Square } | null>(null);
  const [drag, setDrag] = useState<{ sq: Square; x: number; y: number } | null>(null);

  // Yurish animatsiyasi: fen o'zgarganda oxirgi yurgan dona eski joyidan sirg'aladi, olingan dona so'nadi
  const anim = useRef(new Animated.Value(1)).current;
  const prev = useRef({ fen, board });
  const ghost = useRef<{ code: string; sq: Square } | null>(null);
  const kick = useRef(false);
  if (prev.current.fen !== fen) {
    ghost.current = null;
    if (lastMove) {
      const [r, c] = rc(lastMove[1]);
      const was = prev.current.board[r][c];
      if (was) ghost.current = { code: was.color + was.type.toUpperCase(), sq: lastMove[1] };
      anim.setValue(0); kick.current = true;
    }
    prev.current = { fen, board };
  }
  useEffect(() => {
    if (kick.current) { kick.current = false; Animated.timing(anim, { toValue: 1, duration: SLIDE_MS, useNativeDriver: true }).start(); }
  });
  useEffect(() => { setArrows([]); setMarks([]); setSel(null); }, [clearKey]);

  const flip = orientation === 'b';
  const xy = (sq: Square): [number, number] => {
    const f = FILES.indexOf(sq[0]), rk = Number(sq[1]) - 1;
    return [(flip ? 7 - f : f) * S, (flip ? rk : 7 - rk) * S];
  };
  const at = (x: number, y: number): Square | null => {
    if (!S) return null;
    const c = Math.floor(x / S), r = Math.floor(y / S);
    if (c < 0 || c > 7 || r < 0 || r > 7) return null;
    return `${FILES[flip ? 7 - c : c]}${flip ? r + 1 : 8 - r}` as Square;
  };
  const canMove = (sq: Square) => { const p = game.get(sq); return !!p && !!movable && p.color === movable && game.turn() === movable; };
  const targets = useMemo(() => (sel && canMove(sel) ? game.moves({ square: sel, verbose: true }).map((m) => m.to) : []), [sel, game, movable]);

  const cycle = <T extends { c: number },>(list: T[], hit: (x: T) => boolean, make: () => T): T[] => {
    const i = list.findIndex(hit);
    if (i < 0) return [...list, make()];
    const nx = list[i].c + 1;
    return nx >= MARK.length ? list.filter((_, k) => k !== i) : list.map((x, k) => (k === i ? { ...x, c: nx } : x));
  };
  const doMove = (from: Square, to: Square) => {
    setSel(null); setArrows([]); setMarks([]);
    onMove?.(from, to);
  };
  const tap = (sq: Square) => {
    if (sel && targets.includes(sq)) return doMove(sel, sq);
    setSel(canMove(sq) && sq !== sel ? sq : null);
  };

  // Barmoq: PanResponder bir marta yaratiladi — joriy qiymatlar ref orqali
  const live = useRef({ at, canMove, tap, doMove, targets, pen, setPreview, setDrag, setSel, setArrows, setMarks, cycle, onBusy });
  live.current = { at, canMove, tap, doMove, targets, pen, setPreview, setDrag, setSel, setArrows, setMarks, cycle, onBusy };
  const g = useRef<{ mode: 'pending' | 'arrow' | 'drag' | 'none'; sq: Square | null; x0: number; y0: number; t: ReturnType<typeof setTimeout> | null }>({ mode: 'none', sq: null, x0: 0, y0: 0, t: null });
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      const L = live.current, x = e.nativeEvent.locationX, y = e.nativeEvent.locationY, sq = L.at(x, y);
      L.onBusy?.(true);
      g.current = { mode: L.pen ? 'arrow' : 'pending', sq, x0: x, y0: y, t: null };
      if (L.pen && sq) L.setPreview({ from: sq, to: sq });
      else g.current.t = setTimeout(() => {
        if (g.current.mode === 'pending' && g.current.sq) { g.current.mode = 'arrow'; live.current.setPreview({ from: g.current.sq, to: g.current.sq }); }
      }, LONG_MS);
    },
    onPanResponderMove: (_e, gs) => {
      const L = live.current, G0 = g.current, x = G0.x0 + gs.dx, y = G0.y0 + gs.dy;
      if (!G0.sq) return;
      if (G0.mode === 'pending' && Math.hypot(gs.dx, gs.dy) > MOVE_PX) {
        if (G0.t) clearTimeout(G0.t);
        G0.mode = L.canMove(G0.sq) ? 'drag' : 'none';
        if (G0.mode === 'drag') L.setSel(G0.sq);
      }
      if (G0.mode === 'drag') L.setDrag({ sq: G0.sq, x, y });
      if (G0.mode === 'arrow') { const to = L.at(x, y); if (to) L.setPreview({ from: G0.sq, to }); }
    },
    onPanResponderRelease: (_e, gs) => {
      const L = live.current, G0 = g.current;
      if (G0.t) clearTimeout(G0.t);
      L.onBusy?.(false);
      const to = L.at(G0.x0 + gs.dx, G0.y0 + gs.dy);
      if (!G0.sq) return;
      if (G0.mode === 'arrow') {
        L.setPreview(null);
        const from = G0.sq;
        if (!to || to === from) L.setMarks((m: Mark[]) => L.cycle(m, (x) => x.sq === from, () => ({ sq: from, c: 0 })));
        else L.setArrows((a: Arrow[]) => L.cycle(a, (x) => x.from === from && x.to === to, () => ({ from, to, c: 0 })));
      } else if (G0.mode === 'drag') {
        L.setDrag(null);
        if (to && to !== G0.sq && L.targets.includes(to)) L.doMove(G0.sq, to);
      } else if (G0.mode === 'pending') L.tap(G0.sq);
      G0.mode = 'none';
    },
    onPanResponderTerminate: () => { live.current.onBusy?.(false); if (g.current.t) clearTimeout(g.current.t); g.current.mode = 'none'; live.current.setPreview(null); live.current.setDrag(null); },
  })).current;

  const check = game.inCheck() ? (() => { for (const row of board) for (const p of row) if (p && p.type === 'k' && p.color === game.turn()) return p.square; return null; })() : null;
  const arrowEl = (a: { from: Square; to: Square }, color: string, key: string, n?: number) => {
    const [x1, y1] = xy(a.from), [x2, y2] = xy(a.to), h = S / 2;
    const ax = x1 + h, ay = y1 + h, bx = x2 + h, by = y2 + h;
    const ang = Math.atan2(by - ay, bx - ax), hl = S * 0.42, hw = S * 0.28, w = S * 0.16;
    const ex = bx - Math.cos(ang) * hl * 0.9, ey = by - Math.sin(ang) * hl * 0.9;
    const p = (d: number, s: number) => `${bx - Math.cos(ang) * d - Math.sin(ang) * s},${by - Math.sin(ang) * d + Math.cos(ang) * s}`;
    return (
      <G key={key} opacity={0.85}>
        <Line x1={ax} y1={ay} x2={ex} y2={ey} stroke={color} strokeWidth={w} strokeLinecap="round" />
        <Polygon points={`${bx},${by} ${p(hl, hw)} ${p(hl, -hw)}`} fill={color} />
        {n !== undefined && (
          <G>
            <Circle cx={(ax + ex) / 2} cy={(ay + ey) / 2} r={S * 0.17} fill="#fff" stroke={color} strokeWidth={2} />
            <SvgText x={(ax + ex) / 2} y={(ay + ey) / 2 + S * 0.07} fontSize={S * 0.2} fontWeight="bold" fill="#222" textAnchor="middle">{n}</SvgText>
          </G>
        )}
      </G>
    );
  };

  return (
    <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width / 8) * 8)} style={{ width: '100%', aspectRatio: 1 }}>
      <View style={{ width: W, height: W, borderRadius: 6, overflow: 'hidden' }} {...pan.panHandlers}>
        <View pointerEvents="none" style={{ position: 'absolute', width: W, height: W }}>
          {W > 0 && board.map((row, r) => row.map((_, c) => {
            const sq = `${FILES[c]}${8 - r}` as Square;
            const [x, y] = xy(sq), light = (r + c) % 2 === 0;
            const hl = sel === sq ? th.sel : lastMove && (lastMove[0] === sq || lastMove[1] === sq) ? th.last : null;
            const fileLbl = (flip ? r === 0 : r === 7), rankLbl = (flip ? c === 7 : c === 0);
            return (
              <View key={sq} style={{ position: 'absolute', left: x, top: y, width: S, height: S, backgroundColor: light ? th.light : th.dark }}>
                {hl && <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: hl }} />}
                {look.coords && fileLbl && <Text style={{ position: 'absolute', right: 2, bottom: 0, fontSize: S * 0.2, fontWeight: '700', color: light ? th.dark : th.light }}>{sq[0]}</Text>}
                {look.coords && rankLbl && <Text style={{ position: 'absolute', left: 2, top: 0, fontSize: S * 0.2, fontWeight: '700', color: light ? th.dark : th.light }}>{sq[1]}</Text>}
              </View>
            );
          }))}
        </View>

        {W > 0 && (
          <Svg pointerEvents="none" width={W} height={W} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="chk" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FF2020" stopOpacity="0.95" />
                <Stop offset="0.55" stopColor="#E01010" stopOpacity="0.55" />
                <Stop offset="1" stopColor="#E01010" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {check && (() => { const [x, y] = xy(check); return <Rect x={x} y={y} width={S} height={S} fill="url(#chk)" />; })()}
            {targets.map((t) => {
              const [x, y] = xy(t), occupied = !!game.get(t);
              return occupied
                ? <Circle key={t} cx={x + S / 2} cy={y + S / 2} r={S * 0.46} stroke="rgba(0,0,0,0.22)" strokeWidth={S * 0.08} fill="none" />
                : <Circle key={t} cx={x + S / 2} cy={y + S / 2} r={S * 0.15} fill="rgba(0,0,0,0.2)" />;
            })}
          </Svg>
        )}

        {/* Donalar */}
        {W > 0 && board.flat().map((p) => {
          if (!p) return null;
          const code = p.color + p.type.toUpperCase(), [x, y] = xy(p.square);
          if (drag && drag.sq === p.square) return null;
          const moving = lastMove && lastMove[1] === p.square;
          if (moving) {
            const [fx, fy] = xy(lastMove[0]);
            const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [fx - x, 0] });
            const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [fy - y, 0] });
            return <Animated.Image key={p.square} pointerEvents="none" source={imgs[code]} style={{ position: 'absolute', left: x, top: y, width: S, height: S, transform: [{ translateX: tx }, { translateY: ty }] }} />;
          }
          return <Image key={p.square} pointerEvents="none" source={imgs[code]} style={{ position: 'absolute', left: x, top: y, width: S, height: S }} />;
        })}
        {W > 0 && ghost.current && (() => {
          const [x, y] = xy(ghost.current.sq);
          return <Animated.Image pointerEvents="none" source={imgs[ghost.current.code]} style={{ position: 'absolute', left: x, top: y, width: S, height: S, opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }} />;
        })()}

        {/* Reja: aylanalar va strelkalar */}
        {W > 0 && (
          <Svg pointerEvents="none" width={W} height={W} style={{ position: 'absolute' }}>
            {marks.map((m) => { const [x, y] = xy(m.sq); return <Circle key={`m${m.sq}`} cx={x + S / 2} cy={y + S / 2} r={S * 0.44} stroke={MARK[m.c]} strokeWidth={S * 0.07} fill="none" />; })}
            {arrows.map((a, i) => arrowEl(a, MARK[a.c], `a${i}`, arrows.length > 1 ? i + 1 : undefined))}
            {preview && preview.from !== preview.to && arrowEl(preview, MARK[0], 'pv')}
          </Svg>
        )}

        {/* Sudralayotgan dona — barmoq ostida, sal kattaroq */}
        {drag && (() => {
          const p = game.get(drag.sq);
          return p ? <Image pointerEvents="none" source={imgs[p.color + p.type.toUpperCase()]} style={{ position: 'absolute', left: drag.x - S * 0.6, top: drag.y - S * 0.85, width: S * 1.2, height: S * 1.2 }} /> : null;
        })()}

        {/* Baholash belgisi (★, ✗, ??...) — katakning yuqori o'ng burchagida */}
        {badge && W > 0 && (() => {
          const [x, y] = xy(badge.sq), d = S * 0.42;
          return (
            <View pointerEvents="none" style={{ position: 'absolute', left: Math.min(W - d, x + S - d * 0.6), top: Math.max(0, y - d * 0.35), width: d, height: d, borderRadius: d / 2,
              backgroundColor: badge.color, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: d * 0.5 }}>{badge.text}</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );
}

function rc(sq: Square): [number, number] { return [8 - Number(sq[1]), FILES.indexOf(sq[0])]; }
