/**
 * quick.tsx — Miya o'yinlari (shaxmatdan tashqari). Har biri bir xil shaklda:
 *   <Game level={n} onDone={(ball 0..100, xatolar[]) => ...} />
 * Daraja (level) o'yinni qiyinlashtiradi; natija bo'yicha game/[id].tsx darajani o'zi moslaydi.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';
import { logicSet } from '@/lib/ai';
import { makeProblem, type Problem } from '@/lib/speed-math';
import { QuizRunner } from '@/ui/choice';
import { Bar, Button, T } from '@/ui/kit';

export interface GameProps { level: number; onDone: (score: number, mistakes: string[]) => void }
const rnd = (n: number) => Math.floor(Math.random() * n);
const shuffle = <X,>(a: X[]) => [...a].sort(() => Math.random() - 0.5);

/** Taymer: soniya qolganini qaytaradi; 0 bo'lsa onEnd bir marta chaqiriladi. */
function useCountdown(seconds: number, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const ended = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setLeft((x) => Math.max(0, x - 0.1)), 100);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0 && !ended.current) { ended.current = true; onEnd(); }
  }, [left, onEnd]);
  return [left, setLeft] as const;
}

// ── ⚡ Tezkor hisob ─────────────────────────────────────────────────────────
export function SpeedMath({ level, onDone }: GameProps) {
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [p, setP] = useState<Problem>(() => makeProblem(level * 4));
  const target = 10 + level * 3;                      // 100% uchun kerakli to'g'ri javoblar
  const [left, setLeft] = useCountdown(60, () => onDone((score / target) * 100, wrong.slice(-8)));
  const answer = (v: number) => {
    if (v === p.answer) { setScore((x) => x + 1); setP(makeProblem(level * 4 + score + 1)); }
    else { setLeft((t) => Math.max(0, t - 3)); setWrong((w) => [...w, `${p.text} = ${p.answer} (javob: ${v})`]); }
  };
  return (
    <View style={{ gap: 16 }}>
      <Bar value={left / 60} color={left < 10 ? C.red : C.green} />
      <T dim>Ball: {score} / maqsad {target} · xato −3 s</T>
      <Text style={s.big}>{p.text}</Text>
      <View style={s.grid}>
        {p.options.map((o) => <Pressable key={o} onPress={() => answer(o)} style={s.btn}><Text style={s.btnText}>{o}</Text></Pressable>)}
      </View>
    </View>
  );
}

// ── ⚡ Reaksiya ─────────────────────────────────────────────────────────────
export function Reaction({ onDone }: GameProps) {
  const ROUNDS = 5;
  const [state, setState] = useState<'wait' | 'go' | 'early'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const shown = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = () => {
    setState('wait');
    timer.current = setTimeout(() => { shown.current = Date.now(); setState('go'); }, 1200 + rnd(2500));
  };
  useEffect(() => { arm(); return () => { if (timer.current) clearTimeout(timer.current); }; }, []);
  const tap = () => {
    if (state === 'wait') { if (timer.current) clearTimeout(timer.current); setState('early'); setTimeout(arm, 900); return; }
    if (state !== 'go') return;
    const ms = Date.now() - shown.current;
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= ROUNDS) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      onDone(((500 - avg) / 250) * 100, [`o'rtacha ${Math.round(avg)} ms`]);   // 250 ms → 100%, 500 ms → 0%
    } else arm();
  };
  return (
    <Pressable onPress={tap} style={[s.reaction, { backgroundColor: state === 'go' ? C.green : state === 'early' ? C.red : C.card }]}>
      <Text style={[s.btnText, { color: state === 'go' ? C.bg : C.text }]}>
        {state === 'go' ? 'BOSING!' : state === 'early' ? 'Erta bosdingiz!' : 'Yashil bo\'lishini kuting...'}
      </Text>
      <T dim>{times.length}/{ROUNDS} {times.length ? `· oxirgi ${times[times.length - 1]} ms` : ''}</T>
    </Pressable>
  );
}

// ── 🎯 Stroop: so'z bir rangda yozilgan, ma'nosi boshqa rang ─────────────────
// Tugmalarda rang NOMLARI yoziladi (rang emas) va o'zi ham chalg'ituvchi rangda — shunda so'zni o'qish
// odati xalaqit beradi. Har savolda qoida: "RANG" (yozuv rangi) yoki "MA'NO" (so'zning o'zi).
// 3-darajadan boshlab qoidalar aralashadi.
const COLORS = [
  { name: 'QIZIL', c: '#F87171' }, { name: 'YASHIL', c: '#34D399' }, { name: 'KO\'K', c: '#60A5FA' }, { name: 'SARIQ', c: '#FBBF24' },
];
export function Stroop({ level, onDone }: GameProps) {
  const mixed = level >= 3;
  const make = () => {
    const word = rnd(4);
    let ink = rnd(4);
    while (ink === word) ink = rnd(4);                       // har doim mos kelmaydi — chalg'itish majburiy
    const rule: 'ink' | 'word' = mixed && Math.random() < 0.4 ? 'word' : 'ink';
    return { word, ink, rule, btn: shuffle([0, 1, 2, 3]), btnInk: shuffle([0, 1, 2, 3]) };
  };
  const [q, setQ] = useState(make);
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState<string[]>([]);
  const secs = Math.max(25, 45 - level * 3);
  const target = 14 + level * 3;
  useCountdown(secs, () => onDone((ok / target) * 100 - bad.length * 4, bad.slice(-6)));
  const pick = (i: number) => {
    const right = q.rule === 'ink' ? q.ink : q.word;
    if (i === right) setOk((x) => x + 1);
    else setBad((b) => [...b, `${q.rule === 'ink' ? 'RANG' : "MA'NO"}: "${COLORS[q.word].name}" (${COLORS[q.ink].name.toLowerCase()} rangda) → siz ${COLORS[i].name}`]);
    setQ(make());
  };
  return (
    <View style={{ gap: 16 }}>
      <T dim>{secs} s · ✓{ok} ✗{bad.length}</T>
      <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: q.rule === 'ink' ? C.green : '#FBBF24' }}>
        {q.rule === 'ink' ? '🎨 YOZUV RANGINI tanlang' : "📖 SO'ZNING MA'NOSINI tanlang"}
      </Text>
      <Text style={[s.big, { color: COLORS[q.ink].c }]}>{COLORS[q.word].name}</Text>
      <View style={s.grid}>
        {q.btn.map((i, k) => (
          <Pressable key={i} onPress={() => pick(i)} style={s.btn}>
            <Text style={[s.btnText, { color: COLORS[q.btnInk[k]].c }]}>{COLORS[i].name}</Text>
          </Pressable>
        ))}
      </View>
      <T dim size={13}>Tugmalardagi yozuvlar ham boshqa rangda — faqat yozilgan NOMGA qarang.</T>
    </View>
  );
}

// ── 🧠 Xotira panjarasi ─────────────────────────────────────────────────────
export function MemoryGrid({ level, onDone }: GameProps) {
  const ROUNDS = 5;
  const size = Math.min(6, 3 + Math.floor((level - 1) / 2));      // 3×3 → 6×6
  const count = Math.min(size * size - 2, 2 + level);
  const [round, setRound] = useState(0);
  const [cells, setCells] = useState<number[]>([]);
  const [show, setShow] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  useEffect(() => {
    setCells(shuffle([...Array(size * size).keys()]).slice(0, count));
    setPicked([]); setShow(true);
    const t = setTimeout(() => setShow(false), 900 + count * 250);
    return () => clearTimeout(t);
  }, [round, size, count]);
  const tap = (i: number) => {
    if (show || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    const wrongs = next.filter((x) => !cells.includes(x)).length;
    if (next.length - wrongs >= count || wrongs >= 3) {
      const sc = Math.max(0, ((next.length - wrongs) / count) * 100 - wrongs * 15);
      const all = [...scores, sc];
      setScores(all);
      setTimeout(() => (round + 1 >= ROUNDS
        ? onDone(all.reduce((a, b) => a + b, 0) / all.length, [`${size}×${size}, ${count} katak`])
        : setRound(round + 1)), 600);
    }
  };
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <T dim>{round + 1}/{ROUNDS} · {show ? 'Eslab qoling!' : `${count} ta katakni bosing`}</T>
      <View style={{ width: 300, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {[...Array(size * size).keys()].map((i) => {
          const lit = show && cells.includes(i);
          const hit = picked.includes(i) && cells.includes(i);
          const miss = picked.includes(i) && !cells.includes(i);
          return (
            <Pressable key={i} onPress={() => tap(i)} style={{
              width: (300 - 6 * (size - 1)) / size, height: (300 - 6 * (size - 1)) / size, borderRadius: 8,
              backgroundColor: lit || hit ? C.green : miss ? C.red : C.card, borderWidth: 1, borderColor: C.cardBorder,
            }} />
          );
        })}
      </View>
    </View>
  );
}

// ── 🔁 N-back ───────────────────────────────────────────────────────────────
// Harflar birin-ketin chiqadi. Hozirgi harf N qadam OLDINGI harf bilan bir xil bo'lsa — "Mos" ni bosing.
// Har harfdan keyin darhol javob ko'rsatiladi: ✓ to'g'ri, ✗ o'tkazib yuborildi / noto'g'ri bosildi.
export function NBack({ level, onDone }: GameProps) {
  const n = Math.min(4, Math.ceil(level / 2));                       // 1-back, 2-back ...
  const LEN = 20 + n;
  const seq = useMemo(() => {
    const letters = 'BCDFGHKLMPRST';
    const out: string[] = [];
    for (let i = 0; i < LEN; i++) out.push(i >= n && Math.random() < 0.33 ? out[i - n] : letters[rnd(letters.length)]);
    return out;
  }, [n, LEN]);
  const [i, setI] = useState(-1);                                     // -1 — tushuntirish
  const [said, setSaid] = useState(false);
  const [fb, setFb] = useState<'ok' | 'bad' | null>(null);
  const res = useRef({ right: 0, total: 0, miss: [] as string[] });

  // Harf vaqti tugaganda — baholaymiz va keyingisiga o'tamiz
  useEffect(() => {
    if (i < 0) return;
    if (i >= LEN) {
      const r = res.current;
      onDone((r.right / Math.max(1, r.total) - 0.5) * 200, [`${n}-back`, ...r.miss.slice(0, 5)]);
      return;
    }
    const t = setTimeout(() => {
      if (i >= n) {
        const match = seq[i] === seq[i - n];
        const r = res.current;
        r.total++;
        if (match === said) { r.right++; setFb('ok'); }
        else { setFb('bad'); r.miss.push(match ? `${seq[i]} — mos edi, bosilmadi` : `${seq[i]} — mos emasdi, bosildi`); }
      }
      setSaid(false);
      setTimeout(() => { setFb(null); setI((x) => x + 1); }, 350);
    }, 2000);
    return () => clearTimeout(t);
  }, [i]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (i < 0) {
    return (
      <View style={{ gap: 14 }}>
        <T bold size={18}>{n}-back</T>
        <T>Harflar bittadan chiqadi. Agar hozirgi harf <Text style={{ fontWeight: '800', color: C.green }}>{n} ta oldingi</Text> harf bilan bir xil bo'lsa — "Mos" ni bosing. Bo'lmasa — hech narsa bosmang.</T>
        <T dim>Misol ({n}-back): {n === 1 ? 'K, K → ikkinchi K da bosing' : n === 2 ? 'K, M, K → uchinchi harfda (K) bosing' : `${'K, ' + 'M, '.repeat(n - 1)}K → oxirgi K da bosing`}</T>
        <Button label="Tushundim, boshlash" onPress={() => setI(0)} />
      </View>
    );
  }
  return (
    <View style={{ gap: 18, alignItems: 'center' }}>
      <T dim>{n}-back · {Math.min(i + 1, LEN)}/{LEN} · ✓{res.current.right}/{res.current.total}</T>
      <Bar value={i / LEN} />
      <View style={{ width: 160, height: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        backgroundColor: fb === 'ok' ? C.greenSoft : fb === 'bad' ? C.redSoft : C.card, borderWidth: 2,
        borderColor: fb === 'ok' ? C.green : fb === 'bad' ? C.red : C.cardBorder }}>
        <Text style={{ color: C.text, fontSize: 90, fontWeight: '800' }}>{seq[i] ?? ''}</Text>
      </View>
      <Pressable disabled={i < n || said} onPress={() => setSaid(true)} style={({ pressed }) => [s.btn, { width: '100%', flexGrow: 0 },
        said && { borderColor: C.green, backgroundColor: C.greenSoft }, pressed && { opacity: 0.7 }, i < n && { opacity: 0.4 }]}>
        <Text style={s.btnText}>{said ? '✓ Mos deb belgilandi' : 'Mos'}</Text>
      </Pressable>
      {i < n && <T dim>Birinchi {n} ta harfni eslab qoling...</T>}
    </View>
  );
}

// ── 🧩 Ketma-ketlik: keyingi son qaysi? ──────────────────────────────────────
function makeSequence(level: number): { shown: number[]; answer: number; rule: string } {
  const kinds = level < 3 ? ['add', 'mul'] : level < 5 ? ['add', 'mul', 'alt', 'sq'] : ['alt', 'sq', 'fib', 'add2'];
  const k = kinds[rnd(kinds.length)];
  const a = 1 + rnd(9), d = 2 + rnd(3 + level), xs: number[] = [];
  if (k === 'add') for (let i = 0; i < 6; i++) xs.push(a + d * i);
  if (k === 'mul') for (let i = 0; i < 6; i++) xs.push(a * 2 ** i);
  if (k === 'alt') for (let i = 0; i < 6; i++) xs.push(i % 2 ? xs[i - 1] - d + 1 : (xs[i - 1] ?? a) + d * 2);
  if (k === 'sq') for (let i = 0; i < 6; i++) xs.push((i + 1 + rnd(1)) ** 2 + (level > 4 ? a : 0));
  if (k === 'fib') { xs.push(a, a + 1); for (let i = 2; i < 6; i++) xs.push(xs[i - 1] + xs[i - 2]); }
  if (k === 'add2') { xs.push(a); for (let i = 1; i < 6; i++) xs.push(xs[i - 1] + d + i); }
  const rules: Record<string, string> = { add: '+ bir xil son', mul: '× 2', alt: 'navbatma-navbat qo\'shish/ayirish', sq: 'kvadratlar', fib: 'oldingi ikkisining yig\'indisi', add2: 'qo\'shiluvchi har safar 1 ga oshadi' };
  return { shown: xs.slice(0, 5), answer: xs[5], rule: rules[k] };
}
export function Sequence({ level, onDone }: GameProps) {
  const ROUNDS = 8;
  const [r, setR] = useState(0);
  const [q, setQ] = useState(() => makeSequence(level));
  const [ok, setOk] = useState(0);
  const [miss, setMiss] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const opts = useMemo(() => shuffle([...new Set([q.answer, q.answer + 1 + rnd(3), q.answer - 1 - rnd(3), q.answer + 5 + rnd(5)])]), [q]);
  const pick = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    if (v === q.answer) setOk((x) => x + 1); else setMiss((m) => [...m, `${q.shown.join(', ')} → ${q.answer} (${q.rule})`]);
  };
  const next = () => {
    if (r + 1 >= ROUNDS) onDone(((ok) / ROUNDS) * 100, miss);
    else { setR(r + 1); setQ(makeSequence(level)); setPicked(null); }
  };
  return (
    <View style={{ gap: 16 }}>
      <T dim>{r + 1}/{ROUNDS} · Keyingi son qaysi?</T>
      <Text style={[s.big, { fontSize: 30 }]}>{q.shown.join(',  ')},  ?</Text>
      <View style={s.grid}>
        {opts.map((o) => (
          <Pressable key={o} onPress={() => pick(o)} style={[s.btn, picked !== null && o === q.answer && { borderColor: C.green },
            picked === o && o !== q.answer && { borderColor: C.red }]}>
            <Text style={s.btnText}>{o}</Text>
          </Pressable>
        ))}
      </View>
      {picked !== null && <><T dim>Qoida: {q.rule}</T><Button label="Keyingisi" onPress={next} /></>}
    </View>
  );
}

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

// ── 🧩 Mantiqiy masalalar (AI yaratadi) ─────────────────────────────────────
export function LogicAI({ level, onDone }: GameProps) {
  const [items, setItems] = useState<{ q: string; options: string[]; answer: string; why: string }[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    logicSet(level).then(setItems).catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [level]);
  if (err) return <T color={C.red}>{err}</T>;
  if (!items) return <T dim>⏳ AI masalalar tayyorlamoqda...</T>;
  return <QuizRunner items={items} onFinish={(c) => onDone((c / items.length) * 100, [])} finishLabel="Natija" />;
}

const s = StyleSheet.create({
  big: { color: C.text, fontSize: 52, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btn: { width: '47%', flexGrow: 1, paddingVertical: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  btnText: { color: C.text, fontSize: 24, fontWeight: '700' },
  reaction: { height: 360, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
