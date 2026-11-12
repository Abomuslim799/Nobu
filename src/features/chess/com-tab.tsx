/**
 * com-tab.tsx — 🔍 Tahlil: chess.com o'yinlarini yuklash va telefonda tahlil qilish, tashxis, uslub, haftalik reja, o'yinlar ro'yxati.
 */

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { C } from '@/core/theme';
import { Bar, Button, Card, T } from '@/core/ui/kit';
import { CAUSE, LABEL, type Label } from '@/features/chess/analysis';
import { analyseAll, cloudRun, cloudStatus, fetchCom, loadAn, loadCom, syncCloud, type CloudStatus, type ComGame, type GameAn } from '@/features/chess/chesscom';
import { diagnose, style, weeklyPlan } from '@/features/chess/coach';

const hm = (s: number) => new Date(s * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ComTab() {
  const [user, setUser] = useState('Abomuslim0');
  const [games, setGames] = useState<ComGame[]>([]);
  const [an, setAn] = useState<Record<string, GameAn>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [prog, setProg] = useState<{ done: number; total: number; ply: number; plies: number } | null>(null);
  const stop = useRef(false);
  const [cloud, setCloud] = useState<string | null>(null);
  const [cs, setCs] = useState<CloudStatus | null>(null);
  const seen = useRef(-1);

  useEffect(() => {
    (async () => {
      const c0 = await loadCom(), m0 = await loadAn();
      setUser(c0.user); setGames(c0.games); setAn(m0);
      await pull();
      cloudStatus().then(setCs).catch(() => {});
    })();
    return () => { stop.current = true; };
  }, []);

  const pull = async () => {                              // serverdagi tayyor tahlilni olish
    const s = await syncCloud();
    if (s) setCloud(s.added || s.analysed ? `+${s.added} o'yin, ${s.analysed} tahlil olindi` : null);
    const [c, m] = await Promise.all([loadCom(), loadAn()]);
    setGames(c.games); setAn(m);
  };
  useEffect(() => {                                        // server ishlayotganda — 4 s da holat, har yangi o'yinda natija
    if (!cs?.running) return;
    const t = setInterval(async () => {
      const s = await cloudStatus().catch(() => null);
      if (!s) return;
      if (s.done !== seen.current || !s.running) { seen.current = s.done; await pull(); }
      setCs(s);
    }, 4000);
    return () => clearInterval(t);
  }, [cs?.running]);
  const runCloud = async () => { setErr(''); try { setCs(await cloudRun()); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } };

  const run = async () => {
    stop.current = false;
    setProg({ done: 0, total: 0, ply: 0, plies: 0 });
    const res = await analyseAll((done, total, ply, plies) => setProg({ done, total, ply, plies }), () => stop.current);
    setAn({ ...res }); setProg(null);
  };
  const load = async () => {
    setErr(''); setBusy("chess.com'dan yuklanmoqda…");
    try {
      const r = await fetchCom(user.trim(), 30);
      setGames(r.games); setBusy(null);
      runCloud();                                          // yangilarini server tahlil qilsin
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); setBusy(null); }
  };

  const d = diagnose(games, an), st = d.games >= 5 ? style(games, an) : [], plan = weeklyPlan(d);
  const todo = games.filter((g) => !an[g.id]).length;
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <T bold>♟️ chess.com o'yinlaringiz</T>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput value={user} onChangeText={setUser} autoCapitalize="none" placeholder="username" placeholderTextColor={C.dim}
            style={{ flex: 1, color: C.text, fontSize: 16, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.bg }} />
          <View style={{ width: 130 }}><Button label={games.length ? '⬇ Yangilari' : '⬇ Yuklash'} onPress={load} disabled={!!busy || !!prog} /></View>
        </View>
        <T dim size={12}>{games.length} o'yin · tahlil qilingan {games.length - todo}{todo ? ` · navbatda ${todo}` : ''}. Birinchi marta oxirgi 30 o'yin olinadi, keyin yangilari qo'shiladi.</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: C.subtle }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={13}>{cs?.running ? `⏳ Server tahlil qilmoqda${cs.total ? ` · ${cs.done}/${cs.total}` : '…'}${cs.game ? ` · ${cs.game}` : ''}` : '☁️ Server tahlili'}</T>
            <T dim size={11}>{cs ? [cs.updated ? `oxirgisi ${hm(cs.updated)}` : 'hali yo\'q', !cs.running && cs.next ? `keyingisi ~${hm(cs.next)}` : '', cs.error ? `⚠️ ${cs.error.slice(0, 80)}` : ''].filter(Boolean).join(' · ') : 'server ulanmagan yoki javob yo\'q'}</T>
            {!!cloud && <T dim size={11}>{cloud}</T>}
          </View>
          <Pressable onPress={runCloud} disabled={!!cs?.running} style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: cs?.running ? C.card : C.gold, opacity: pressed ? 0.7 : 1 })}>
            <T bold size={13} color={cs?.running ? C.dim : '#2A1E0A'}>{cs?.running ? '…' : 'Hozir tahlil qil'}</T>
          </Pressable>
        </View>
        {!!busy && <T dim>{busy}</T>}
        {!!err && <T color={C.red} size={13}>{err}</T>}
        {prog && (
          <View style={{ gap: 4 }}>
            <T size={13}>🔍 Tahlil: {prog.done}/{prog.total || todo} o'yin{prog.plies ? ` · ${prog.ply}/${prog.plies} pozitsiya` : ''}</T>
            <Bar value={(prog.done + (prog.plies ? prog.ply / prog.plies : 0)) / Math.max(1, prog.total || todo)} color={C.gold} />
            <Pressable onPress={() => { stop.current = true; }}><T dim size={12} style={{ textDecorationLine: 'underline' }}>⏸ To'xtatish (keyin davom etadi)</T></Pressable>
          </View>
        )}
        {!prog && todo > 0 && !busy && !cs?.running && <Pressable onPress={run} hitSlop={6}><T dim size={12} style={{ textDecorationLine: 'underline' }}>📱 yoki telefonda tahlil qilish ({todo})</T></Pressable>}
      </Card>

      {d.games > 0 && (
        <Card style={{ gap: 8 }}>
          <T bold>🩺 Tashxis · {d.games} o'yin</T>
          <T size={14}>O'rtacha aniqlik: <T bold size={14}>{d.acc}%</T>{d.accRecent !== null && d.accPrev !== null ? ` · oxirgilari ${d.accRecent}% (avvalgilari ${d.accPrev}%, ${d.accRecent - d.accPrev >= 0 ? '+' : ''}${d.accRecent - d.accPrev})` : ''}</T>
          {d.causes.slice(0, 3).map((c, i) => (
            <View key={c.cause} style={{ gap: 3 }}>
              <T size={14}>{i + 1}. {CAUSE[c.cause].icon} {CAUSE[c.cause].name} — <T bold size={14}>{c.pct}%</T> <T dim size={12}>({c.n} ta xato)</T></T>
              <Bar value={c.pct / 100} color={i === 0 ? C.red : C.gold} />
              <T dim size={12}>💡 {CAUSE[c.cause].tip}</T>
            </View>
          ))}
          <T dim size={12}>Xatolar bosqich bo'yicha: {d.phases.map((p) => `${p.name} ${p.n}`).join(' · ')}</T>
        </Card>
      )}

      {st.length > 0 && (
        <Card style={{ gap: 6 }}>
          <T bold>🎭 Uslub profili <T dim size={12}>(taxminiy, {d.games} o'yin)</T></T>
          {st.map((s) => (
            <View key={s.axis} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row' }}><T size={14} style={{ flex: 1 }}>{s.axis}</T><T bold size={14}>{s.v}</T></View>
              <Bar value={s.v / 100} color={C.green} />
              <T dim size={11}>{s.note}</T>
            </View>
          ))}
          {d.games < 20 && <T dim size={12}>Profil ~20 o'yindan keyin barqaror bo'ladi.</T>}
        </Card>
      )}

      {d.games > 0 && (
        <Card style={{ gap: 4 }}>
          <T bold>📅 Haftalik reja</T>
          {plan.map((p) => <T key={p.day} size={14}><T bold size={14}>{p.day}</T> · {p.task}</T>)}
        </Card>
      )}

      {d.openings.length > 0 && (
        <Card style={{ gap: 4 }}>
          <T bold>📖 Debyutlar</T>
          {d.openings.map((o) => <T key={o.name} size={13}>{o.name} · {o.n} o'yin · natija {o.win}% · aniqlik {o.acc}%</T>)}
        </Card>
      )}

      {games.slice(0, 60).map((g) => {
        const a = an[g.id];
        const n: Partial<Record<Label, number>> = {};
        a?.moves.forEach((m) => { n[m.label] = (n[m.label] ?? 0) + 1; });
        return (
          <Pressable key={g.id} onPress={() => a && router.push({ pathname: '/chess/review', params: { id: g.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 12, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, gap: 2 })}>
            <T size={14}>{g.result === 'win' ? '🏆' : g.result === 'draw' ? '🤝' : '✗'} {g.color === 'w' ? '⚪' : '⚫'} vs {g.oppName} ({g.opp}) · {g.tc}</T>
            <T dim size={12}>{new Date(g.at).toLocaleDateString()} · siz {g.me}{a ? ` · aniqlik ${a.acc}%` : ' · tahlil kutilmoqda'}{a?.opening ? ` · ${a.opening.split(':')[0]}` : ''}</T>
            {a && <T size={12}>{(['blunder', 'mistake', 'miss', 'inaccuracy'] as Label[]).filter((k) => n[k]).map((k) => `${LABEL[k].sym}×${n[k]}`).join('  ')}</T>}
          </Pressable>
        );
      })}
    </View>
  );
}
