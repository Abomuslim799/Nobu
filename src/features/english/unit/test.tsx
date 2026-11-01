/** Yakuniy test. */

import { router } from 'expo-router';

import { type Unit } from '@/features/english/data/units';
import { Button, Card, T } from '@/core/ui/kit';

// ── 7. Test ─────────────────────────────────────────────────────────────────
export function TestStep({ unit, onDone }: { unit: Unit; onDone: () => void }) {
  return (
    <>
      <Card style={{ gap: 6 }}>
        <T bold>Yakuniy test — 3 bosqich</T>
        <T dim size={14}>Shu movie'ning {unit.vocab.length + unit.collocations.length} so'zi: tarjima ↔ so'z, ovoz → so'z, gapdagi bo'sh joy. Xato topilgan so'zlar kartochkalarda tezroq qaytadi.</T>
      </Card>
      <Button label="🧪 Testni boshlash" onPress={() => { onDone(); router.push(`/english/quiz?deck=${unit.id}`); }} />
      <Button kind="ghost" label="🎴 Avval kartochkalar" onPress={() => router.push(`/english/cards?deck=${unit.id}`)} />
    </>
  );
}
