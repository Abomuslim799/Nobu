/** theme-store.web.ts — brauzerda localStorage. */
export const getSync = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
export const setSync = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* saqlanmadi */ } };
