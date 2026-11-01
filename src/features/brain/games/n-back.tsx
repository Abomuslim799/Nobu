/** Miya o'yini: NBack. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { C } from '@/core/theme';
import { Bar, Button, T } from '@/core/ui/kit';
import { type GameProps, rnd, s } from '@/features/brain/games/kit';

// ── 🔁 N-back ───────────────────────────────────────────────────────────────
// Harflar birin-ketin chiqadi. Hozirgi harf N qadam OLDINGI harf bilan bir xil bo'lsa — "Mos" ni bosing.
// Har harfdan keyin darhol javob ko'rsatiladi: ✓ to'g'ri, ✗ o'tkazib yuborildi / noto'g'ri bosildi.
export function NBack({ level, onDone }: GameProps) {
  const n = Math.min(4, Math.ceil(level / 2));                       // 1-back, 2-back ...
  const LEN = 20 + n;
  // Aniq ~35% mos holat: qaysi o'rinlarda mos bo'lishini oldindan tanlaymiz, qolganlarida — ataylab farqli harf
  const seq = useMemo(() => {
    const letters = 'BCDFGHKLMPRST';
    const slots = [...Array(LEN - n).keys()].map((k) => k + n).sort(() => Math.random() - 0.5);
    const matchAt = new Set(slots.slice(0, Math.round((LEN - n) * 0.35)));
    const out: string[] = [];
    for (let i = 0; i < LEN; i++) {
      if (matchAt.has(i)) { out.push(out[i - n]); continue; }
      let c = letters[rnd(letters.length)];
      while (i >= n && c === out[i - n]) c = letters[rnd(letters.length)];
      out.push(c);
    }
    return out;
  }, [n, LEN]);
  const [i, setI] = useState(-1);                                     // -1 — tushuntirish
  const [said, setSaid] = useState(false);
  const [fb, setFb] = useState<'ok' | 'bad' | null>(null);
  const [msg, setMsg] = useState('');
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
        setMsg(match ? (said ? `✓ To'g'ri — ${seq[i]} mos edi` : `✗ ${seq[i]} mos edi — bosish kerak edi`)
          : (said ? `✗ ${seq[i - n]} ≠ ${seq[i]} — mos emasdi` : `✓ To'g'ri — mos emasdi`));
        if (match === said) { r.right++; setFb('ok'); }
        else { setFb('bad'); r.miss.push(match ? `${seq[i]} — mos edi, bosilmadi` : `${seq[i]} — mos emasdi, bosildi`); }
      }
      setSaid(false);
      setTimeout(() => { setFb(null); setI((x) => x + 1); }, 350);
    }, 2000);
    return () => clearTimeout(t);
  }, [i]);    

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
      {i < n ? <T dim>Birinchi {n} ta harfni eslab qoling...</T>
        : <T bold color={fb === 'bad' ? C.red : C.green} style={{ minHeight: 22 }}>{msg}</T>}
      <T dim size={12} style={{ textAlign: 'center' }}>Har harf 2 soniya. Hozirgi harf {n} qadam oldingisi bilan bir xilmi? Ha — "Mos". Yo'q — kuting.</T>
    </View>
  );
}
