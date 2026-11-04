/**
 * chess/settings.tsx — shaxmat ko'rinishi: dona to'plami, doska temasi, tovush, koordinatalar. Tanlov darhol saqlanadi.
 */

import { Chess, type Square } from 'chess.js';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/core/theme';
import { Card, T } from '@/core/ui/kit';
import { ChessBoard } from '@/features/chess/board';
import { BOARDS, PIECE_SETS, boardOf, setLook, useLook } from '@/features/chess/look';
import { PIECE_IMG } from '@/features/chess/pieces';
import { playSound } from '@/features/chess/sound';

const DEMO = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
const CREDIT: Record<string, string> = {
  samarqand: 'Farobiy uchun asl dizayn (Temuriylar: minora, fil, arg\'umoq, vazir, Go\'ri Amir gumbazi, sarboz)',
  klassik: 'chessnut — Alexis Luengas (Apache 2.0)', seltik: 'celtic — Maurizio Monge (MIT)', neo: 'spatial — Maurizio Monge (MIT)',
  iliq: 'rhosgfx — RhosGFX (CC0)', fantaziya: 'fantasy — Maurizio Monge (MIT)', minimal: 'kiwen-suwi — neverRare (CC BY 4.0)',
};

export default function ChessSettings() {
  const insets = useSafeAreaInsets();
  const look = useLook();
  const [lock, setLock] = useState(false);
  const [demo, setDemo] = useState<{ fen: string; last: [Square, Square] }>({ fen: DEMO, last: ['f8', 'c5'] });
  const tryMove = (from: Square, to: Square) => {
    const g = new Chess(demo.fen);
    try { const m = g.move({ from, to, promotion: 'q' }); playSound(m.captured ? 'capture' : 'move', look.sound); const f = g.fen().split(' '); f[1] = 'w'; f[3] = '-';   // demo: har doim oqlar yuradi
      setDemo({ fen: f.join(' '), last: [from, to] }); } catch { /* noto'g'ri */ }
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}><T size={26}>‹</T></Pressable>
        <T bold size={18}>⚙️ Doska va donalar</T>
      </View>
      <ScrollView scrollEnabled={!lock} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 30 }}>
        <ChessBoard fen={demo.fen} orientation="w" movable="w" lastMove={demo.last} onMove={tryMove} onBusy={setLock} />
        <Pressable onPress={() => setDemo({ fen: DEMO, last: ['f8', 'c5'] })}><T dim size={12} style={{ textAlign: 'center' }}>Doskada sinab ko'ring (oqlar) · ↺ qaytarish</T></Pressable>

        <T bold>Donalar</T>
        {PIECE_SETS.map((p) => (
          <Pressable key={p.id} onPress={() => setLook({ pieces: p.id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: look.pieces === p.id ? C.gold : C.cardBorder }}>
            <View style={{ width: 100 }}><T bold>{p.name}</T></View>
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: boardOf(look).light, borderRadius: 8, paddingHorizontal: 4 }}>
              {['wK', 'wQ', 'wN', 'bK', 'bQ', 'bN'].map((c) => <Image key={c} source={PIECE_IMG[p.id][c]} style={{ width: 34, height: 34 }} />)}
            </View>
          </Pressable>
        ))}

        <T bold>Doska</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {BOARDS.map((b) => (
            <Pressable key={b.id} onPress={() => setLook({ board: b.id })} style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 3, borderColor: look.board === b.id ? C.gold : 'transparent' }}>
                {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: '50%', height: '50%', backgroundColor: i === 0 || i === 3 ? b.light : b.dark }} />)}
              </View>
              <T size={12} dim={look.board !== b.id}>{b.name}</T>
            </Pressable>
          ))}
        </View>

        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T style={{ flex: 1 }}>🔊 Tovushlar</T>
            <Switch value={look.sound} onValueChange={(v) => { setLook({ sound: v }); if (v) playSound('move'); }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T style={{ flex: 1 }}>🔤 Koordinatalar (a–h, 1–8)</T>
            <Switch value={look.coords} onValueChange={(v) => setLook({ coords: v })} />
          </View>
        </Card>
        <Card style={{ gap: 4 }}>
          <T bold size={14}>Reja chizish</T>
          <T dim size={13}>Bosib turib sudrang — strelka. Bosib turing — katak belgisi. Qayta chizsangiz rang almashadi: yashil → qizil → sariq → o'chadi. ✏️ Reja yoqilsa oddiy sudrash ham strelka chizadi. Yurishingizdan keyin strelkalar o'chadi.</T>
        </Card>
        <T dim size={11}>Donalar: {CREDIT[look.pieces]} · lichess-org/lila</T>
      </ScrollView>
    </View>
  );
}
