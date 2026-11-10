/** theme-store.ts — mavzu tanlovini sinxron saqlash (telefonda: expo-sqlite kv-store). */
import kv from 'expo-sqlite/kv-store';

export const getSync = (k: string): string | null => { try { return kv.getItemSync(k); } catch { return null; } };
export const setSync = (k: string, v: string) => { try { kv.setItemSync(k, v); } catch { /* saqlanmadi */ } };
