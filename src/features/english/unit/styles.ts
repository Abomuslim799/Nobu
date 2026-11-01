/** Film (unit) qadamlari uchun umumiy uslublar. */

import { StyleSheet } from 'react-native';

import { C, PAD, R } from '@/core/theme';

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 8 },
  steps: { paddingHorizontal: PAD, gap: 8, paddingBottom: 8 },
  stepChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card, justifyContent: 'center' },
  stepText: { color: C.text, fontWeight: '600', fontSize: 14, lineHeight: 20 },
  body: { padding: PAD, gap: 12, paddingBottom: 60 },
  quote: { color: C.text, fontSize: 21, lineHeight: 30, fontStyle: 'italic', fontWeight: '600' },
  para: { color: C.text, fontSize: 17, lineHeight: 27 },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder },
  input: { color: C.text, fontSize: 16, padding: 12, borderRadius: R - 4, backgroundColor: C.codeBg, borderWidth: 1, borderColor: C.cardBorder },
});
