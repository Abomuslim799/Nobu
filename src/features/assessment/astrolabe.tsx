/**
 * astrolabe.tsx — FR siferblati (usturlob): yoy 800…2200, darajalar oltin nuqtalar, oltin mil — joriy FR.
 * O'rtada: FR soni, daraja nomi, keyingi darajagacha qolgan FR.
 */

import { Platform } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import { C, FONT_DISPLAY } from '@/core/theme';
import { RANKS, nextRank, type RankId } from '@/features/assessment/rating';

const MIN = 800, MAX = 2200, A0 = -220, A1 = 40;
const ang = (v: number) => A0 + ((Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN)) * (A1 - A0);
const pt = (deg: number, r: number): [number, number] => [100 + r * Math.cos((deg * Math.PI) / 180), 100 + r * Math.sin((deg * Math.PI) / 180)];
function arc(from: number, to: number, r: number) {
  const [x1, y1] = pt(from, r), [x2, y2] = pt(to, r);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
}
function star8(r: number) {
  const p: string[] = [];
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, rr = i % 2 ? r * 0.72 : r; p.push(`${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`); }
  return p.join(' ');
}
const SANS = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined;
const TICKS = Array.from({ length: (MAX - MIN) / 50 + 1 }, (_, i) => MIN + i * 50);
export const fmtN = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function Astrolabe({ fr, title, rankId, size = 210 }: { fr: number; title: string; rankId: RankId; size?: number }) {
  const [hx, hy] = pt(ang(fr), 64);
  const nx = nextRank(rankId);
  const sub = !nx ? 'eng yuqori daraja' : fr >= nx.min ? `${nx.title} imtihoni ochiq` : `${nx.title}gacha ${fmtN(nx.min - fr)} FR`;
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 200 172">
      <G transform="translate(100 100)" fill="none" stroke={C.cardBorder} strokeWidth={1}>
        <Polygon points={star8(46)} /><Polygon points={star8(30)} />
      </G>
      <Path d={arc(A0, A1, 84)} stroke={C.surface2} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d={arc(A0, ang(fr), 84)} stroke={C.green} strokeWidth={9} fill="none" strokeLinecap="round" />
      {TICKS.map((v) => {
        const big = v % 200 === 0;
        const [x1, y1] = pt(ang(v), big ? 70 : 75), [x2, y2] = pt(ang(v), 80);
        return <Line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.dim} strokeWidth={big ? 1.6 : 0.8} opacity={big ? 0.9 : 0.5} />;
      })}
      {RANKS.slice(1).map((r) => { const [x, y] = pt(ang(r.min), 92); return <Circle key={r.id} cx={x} cy={y} r={2.6} fill={r.min <= fr ? C.gold : C.dim} />; })}
      <Line x1={100} y1={100} x2={hx} y2={hy} stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={100} cy={100} r={5} fill={C.gold} />
      <SvgText x={100} y={130} textAnchor="middle" fontFamily={SANS} fontWeight="800" fontSize={30} fill={C.text}>{fmtN(fr)}</SvgText>
      <SvgText x={100} y={147} textAnchor="middle" fontFamily={FONT_DISPLAY} fontSize={12.5} fill={C.gold}>{title}</SvgText>
      <SvgText x={100} y={162} textAnchor="middle" fontFamily={SANS} fontSize={9.5} fill={C.dim}>{sub}</SvgText>
    </Svg>
  );
}
