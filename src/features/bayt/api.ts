/**
 * bayt/api.ts — Bayt ul-mol (moliya): server bilan aloqa, turlar, ranglar, kategoriyalar.
 * Barcha hisob-kitob serverda (daily-tracking-/bayt.py) — ilova faqat ko'rsatadi va kiritadi.
 */

import { api } from '@/core/server';
import { C } from '@/core/theme';

export type Status = 'nafaqa' | 'nafs' | 'maqsad' | 'qora';

export interface Wallet { id: string; title: string; offbudget: boolean; balance: number; bank: number | null; diff: number | null }
export interface Summary {
  pending: number; wallets: Wallet[]; total: number; maqsad: number; qora: number; qora_due: number;
  period: null | {
    id: number; start: string; checkpoint: string; days_left: number; spendable: number;
    nafaqa: { total: number; left: number; daily: number; today_spent: number; today_left: number; fixed_unpaid: number };
    nafs: { total: number; left: number; week: number; week_limit: number; week_spent: number; week_left: number };
  };
}
export interface Tx {
  id: number; ts: string; kind: 'expense' | 'income' | 'transfer'; amount: number; status: Status | null;
  category: string | null; wallet: string; to_wallet: string | null; place: string | null; pending: boolean; source: string;
}

const P = '/bayt';
export const getSummary = () => api<Summary>(`${P}/summary`);
export const getDevon = (limit = 30) => api<{ items: Tx[] }>(`${P}/devon?limit=${limit}`).then((r) => r.items);
export const getPending = () => api<{ items: Tx[] }>(`${P}/pending`).then((r) => r.items);
export const addExpense = (b: { amount: number; status: Status; category: string; wallet: string }) =>
  api<{ ok: boolean; summary: Summary }>(`${P}/expense`, b);
export const addIncome = (b: { amount: number; wallet: string; mode: 'new' | 'add'; checkpoint?: string }) =>
  api<{ ok: boolean; summary: Summary }>(`${P}/income`, b);
export const deleteTx = (id: number) => api<{ ok: boolean; summary: Summary }>(`${P}/delete`, { id });
/** Qora kun kartasida avvaldan turgan pul (boshlang'ich summa). */
export const setReserve = (opening: number) => api<{ ok: boolean; summary: Summary }>(`${P}/reserve`, { opening });
export const sortTx = (b: { id: number; action: string; category?: string; mode?: 'new' | 'add'; checkpoint?: string }) =>
  api<{ ok: boolean; summary: Summary }>(`${P}/sort`, b);

/** Status ranglari: Nafaqa — oltin, Nafs — terrakota, Maqsad — firuza, Qora kun — kulrang. */
export const COLOR: Record<Status | 'kirim' | 'cash', string> = {
  nafaqa: C.gold, nafs: '#E59A7A', maqsad: '#7DB8C9', qora: '#8E96A3', kirim: '#8FC79A', cash: '#C9C3B6',
};
export const LABEL: Record<Status, string> = { nafaqa: 'Nafaqa', nafs: 'Nafs', maqsad: 'Maqsad', qora: 'Qora kun' };
export const CATS: Record<Exclude<Status, 'qora'>, string[]> = {
  nafaqa: ['Transport', 'Tushlik', 'Oziq-ovqat', 'Kommunal', 'Aloqa'],
  nafs: ['Game club', 'Oilaviy tadbir', 'Kafe', 'Yangi narsa'],
  maqsad: ['Kurs', 'Kitob', 'Marafon', 'Boshqa maqsad'],
};

/** 1050000 → "1 050 000" */
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
/** "2026-12-10" → "10-dekabr" */
export const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))}-${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** Hamyon nomi: "card:3213" → "*3213", "cash" → "Naqd". */
export const walletShort = (id: string) => (id === 'cash' ? 'Naqd' : id === 'qora' ? 'Qora kun' : id.startsWith('card:') ? `*${id.slice(5)}` : id);
