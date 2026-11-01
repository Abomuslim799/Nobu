/** Miya o'yini: Sudoku. */

import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { T } from '@/core/ui/kit';
import { type GameProps, s, shuffle } from './kit';

// ── 🧩 Sudoku 4×4 / 6×6 ─────────────────────────────────────────────────────
function makeSudoku(n: 4 | 6): number[] {
  const [br, bc] = n === 4 ? [2, 2] : [2, 3];
  const g = Array(n * n).fill(0);
  const ok = (i: number, v: number) => {
    const r = Math.floor(i / n), c = i % n;
    for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
    const r0 = r - (r % br), c0 = c - (c % bc);
    for (let y = 0; y < br; y++) for (let x = 0; x < bc; x++) if (g[(r0 + y) * n + c0 + x] === v) return false;
    return true;
  };
  const fill = (i: number): boolean => {
    if (i >= n * n) return true;
    for (const v of shuffle([...Array(n).keys()].map((x) => x + 1))) {
      if (ok(i, v)) { g[i] = v; if (fill(i + 1)) return true; g[i] = 0; }
    }
    return false;
  };
  fill(0);
  return g;
}
export function Sudoku({ level, onDone }: GameProps) {
  const n: 4 | 6 = level <= 2 ? 4 : 6;
  const [sol] = useState(() => makeSudoku(n));
  const [given] = useState(() => {
    const hide = Math.min(n * n - n, (n === 4 ? 6 : 14) + level * 2);
    const idx = shuffle([...sol.keys()]).slice(0, hide);
    return sol.map((v, i) => (idx.includes(i) ? 0 : v));
  });
  const [cur, setCur] = useState<number[]>(given);
  const [sel, setSel] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const start = useRef(Date.now());
  const put = (v: number) => {
    if (sel === null || given[sel]) return;
    if (sol[sel] !== v) { setMistakes((m) => m + 1); return; }
    const next = cur.map((x, i) => (i === sel ? v : x));
    setCur(next);
    if (next.every((x, i) => x === sol[i])) {
      const secs = (Date.now() - start.current) / 1000;
      onDone(100 - mistakes * 12 - Math.max(0, secs - (n === 4 ? 60 : 180)) / 3, [`${n}×${n}, ${mistakes} xato, ${Math.round(secs)} s`]);
    }
  };
  const cell = n === 4 ? 70 : 50;
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <T dim>{n}×{n} · har qator, ustun va blokda 1–{n} bir martadan · xatolar: {mistakes}</T>
      <View style={{ width: cell * n + 6, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 2, borderColor: C.green }}>
        {cur.map((v, i) => {
          const r = Math.floor(i / n), c = i % n;
          const thickR = c % (n === 4 ? 2 : 3) === (n === 4 ? 1 : 2) && c < n - 1;
          const thickB = r % 2 === 1 && r < n - 1;
          return (
            <Pressable key={i} onPress={() => setSel(i)} style={{
              width: cell, height: cell, alignItems: 'center', justifyContent: 'center',
              backgroundColor: sel === i ? C.greenSoft : C.card,
              borderRightWidth: thickR ? 2 : 0.5, borderBottomWidth: thickB ? 2 : 0.5, borderColor: thickR || thickB ? C.green : C.cardBorder,
            }}>
              <Text style={{ color: given[i] ? C.text : C.green, fontSize: 24, fontWeight: given[i] ? '800' : '600' }}>{v || ''}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[...Array(n).keys()].map((k) => (
          <Pressable key={k} onPress={() => put(k + 1)} style={[s.btn, { width: 48, paddingVertical: 12, flexGrow: 0 }]}>
            <Text style={s.btnText}>{k + 1}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
