/**
 * coach.ts — ko'p o'yin bo'yicha tashxis (sof): eng ko'p xato sabablari, bosqichlar, aniqlik o'zgarishi,
 * debyutlar natijasi, uslub profili (taxminiy) va haftalik reja.
 */

import { Chess } from 'chess.js';

import { BAD, CAUSE, moveAccuracy, type Cause } from '@/features/chess/analysis';
import type { ComGame, GameAn } from '@/features/chess/chesscom';

export interface Diagnosis {
  games: number; acc: number; accRecent: number | null; accPrev: number | null;
  causes: { cause: Exclude<Cause, 'none'>; n: number; pct: number }[];
  phases: { name: string; n: number }[];
  openings: { name: string; n: number; win: number; acc: number }[];
}
export function diagnose(games: ComGame[], an: Record<string, GameAn>): Diagnosis {
  const done = games.filter((g) => an[g.id]);
  const bad = done.flatMap((g) => an[g.id].moves.filter((m) => BAD.includes(m.label)));
  const cnt: Partial<Record<Cause, number>> = {};
  bad.forEach((m) => { if (m.cause !== 'none') cnt[m.cause] = (cnt[m.cause] ?? 0) + 1; });
  const causes = (Object.entries(cnt) as [Exclude<Cause, 'none'>, number][]).sort((a, b) => b[1] - a[1]).map(([cause, n]) => ({ cause, n, pct: Math.round((n / Math.max(1, bad.length)) * 100) }));
  const ph = [0, 0, 0];
  bad.forEach((m) => { ph[m.ply < 20 ? 0 : m.ply < 60 ? 1 : 2]++; });
  const accs = done.map((g) => an[g.id].acc);                         // yangidan eskiga
  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const op: Record<string, { n: number; w: number; a: number[] }> = {};
  done.forEach((g) => {
    const name = (an[g.id].opening ?? "Noma'lum").split(':')[0];
    op[name] = op[name] ?? { n: 0, w: 0, a: [] };
    op[name].n++; op[name].w += g.result === 'win' ? 1 : g.result === 'draw' ? 0.5 : 0; op[name].a.push(an[g.id].acc);
  });
  return {
    games: done.length, acc: mean(accs),
    accRecent: accs.length >= 4 ? mean(accs.slice(0, Math.min(10, Math.floor(accs.length / 2)))) : null,
    accPrev: accs.length >= 4 ? mean(accs.slice(Math.min(10, Math.floor(accs.length / 2)), 20)) : null,
    causes, phases: [{ name: 'Debyut', n: ph[0] }, { name: "O'rta o'yin", n: ph[1] }, { name: 'Endshpil', n: ph[2] }],
    openings: Object.entries(op).map(([name, v]) => ({ name, n: v.n, win: Math.round((v.w / v.n) * 100), acc: mean(v.a) })).sort((a, b) => b.n - a.n).slice(0, 6),
  };
}

export interface Style { axis: string; v: number; note: string }
/** Uslub profili (0–100, taxminiy): o'yinlarni qayta o'ynab, yurish turlari va baholar bo'yicha. */
export function style(games: ComGame[], an: Record<string, GameAn>): Style[] {
  let my = 0, sharp = 0, retreat = 0, advance = 0, quietAcc: number[] = [], worseAcc: number[] = [], swing = 0, swN = 0, misses = 0, chances = 0;
  for (const g of games) {
    const a = an[g.id]; if (!a) continue;
    const c = new Chess();
    const byPly = new Map(a.moves.map((m) => [m.ply, m]));
    g.moves.forEach((u, i) => {
      const mine = (g.color === 'w') === (i % 2 === 0);
      const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      if (!mine) return;
      my++;
      if (m.san.includes('+') || m.captured) sharp++;
      const dr = Number(m.to[1]) - Number(m.from[1]), fwd = g.color === 'w' ? dr : -dr;
      if (m.piece !== 'p' && m.piece !== 'k' && fwd < 0) retreat++;
      if (fwd > 0) advance++;
      const ma = byPly.get(i);
      if (ma) {
        if (!m.captured && !m.san.includes('+')) quietAcc.push(moveAccuracy(ma.drop));
        if (ma.winBefore < 40) worseAcc.push(moveAccuracy(ma.drop));
        if (ma.winBefore >= 70) { chances++; if (ma.label === 'miss') misses++; }
      }
      if (i > 0) { swing += Math.abs(a.evals[i + 1] - a.evals[i - 1]); swN++; }
    });
  }
  const pct = (x: number, scale: number) => Math.round(Math.max(0, Math.min(100, (x / scale) * 100)));
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  if (!my) return [];
  return [
    { axis: '⚔️ Hujumkor', v: pct(sharp / my + advance / my * 0.3, 0.55), note: 'shax, olish va oldinga yurishlar ulushi' },
    { axis: '🛡️ Himoyakor', v: Math.round(mean(worseAcc)), note: "yomon pozitsiyadagi aniqlik" },
    { axis: '🐢 Passiv', v: pct(retreat / my, 0.25), note: 'orqaga chekinishlar ulushi' },
    { axis: '🧩 Taktik', v: chances ? Math.round(100 - (misses / chances) * 100) : 50, note: "yutuqli joyda imkoniyatni ko'rish" },
    { axis: '♟️ Pozitsion', v: Math.round(mean(quietAcc)), note: 'jim yurishlardagi aniqlik' },
    { axis: '🎲 Tavakkal', v: pct(swN ? swing / swN : 0, 12), note: "baho qanchalik keskin o'zgaradi" },
  ];
}

/** Haftalik reja: eng ko'p 2 ta xato sababi bo'yicha. */
export function weeklyPlan(d: Diagnosis): { day: string; task: string }[] {
  const top = d.causes.slice(0, 2).map((c) => c.cause);
  const T: Record<Exclude<Cause, 'none'>, string[]> = {
    threat: ["🎯 Mavzu: Himoyasiz dona — 5 masala; har yurishdan oldin raqib tahdidini ayting", "🤖 Farobiy bilan 1 o'yin: har yurishda CCT tekshiruvi (shax, olish, tahdid)"],
    tactic: ['🎯 Mavzular: Vilka va Bog\'lash — 5+5 masala', '⚡ Sprint — rekordingizni yangilang'],
    time: ['⚡ Sprint (tez qaror)', "♟️ chess.com'da 10+0 o'ynang: 30 s qolganda faqat oddiy, xavfsiz yurish"],
    opening: ["📖 Debyut mashqi: King's Indian (qora) — 1 o'yin", '📖 Debyut mashqi: Austrian Attack (oq) — 1 o\'yin'],
    positional: ["🎯 Mavzu: Jim yurish / Endshpil — 5 masala", "🔍 Bitta yutqazilgan o'yinni murabbiy rejimida tahlil qiling"],
  };
  const base = top.length ? top : (['tactic', 'positional'] as Exclude<Cause, 'none'>[]);
  const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  return days.map((day, i) => ({ day, task: i === 6 ? "🔍 Haftaning tahlili: yangi o'yinlarni yuklang va natijani o'tgan hafta bilan solishtiring" : T[base[i % base.length]][Math.floor(i / base.length) % 2] }));
}
export { CAUSE };
