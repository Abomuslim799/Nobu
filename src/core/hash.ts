/** FNV-1a xesh (base36): ovoz fayllari nomi va keshni yangilash uchun. Server ham shu nomni ishlatadi. */
export function textHash(t: string) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
