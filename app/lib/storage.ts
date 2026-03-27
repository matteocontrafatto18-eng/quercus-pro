'use client';

import type { Montatore, Cantiere, Presenza } from './types';
import { MONTATORI_INIZIALI, CANTIERI_INIZIALI } from './seedData';

const KEYS = {
  montatori: 'qp_montatori',
  cantieri: 'qp_cantieri',
  presenze: 'qp_presenze',
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Montatori
export function getMontatori(): Montatore[] {
  const saved = getItem<Montatore[] | null>(KEYS.montatori, null);
  if (!saved) {
    setItem(KEYS.montatori, MONTATORI_INIZIALI);
    return MONTATORI_INIZIALI;
  }
  return saved;
}

export function saveMontatori(list: Montatore[]): void {
  setItem(KEYS.montatori, list);
}

export function addMontatore(m: Montatore): void {
  const list = getMontatori();
  list.push(m);
  saveMontatori(list);
}

export function updateMontatore(m: Montatore): void {
  const list = getMontatori().map(x => x.id === m.id ? m : x);
  saveMontatori(list);
}

export function deleteMontatore(id: string): void {
  saveMontatori(getMontatori().filter(x => x.id !== id));
}

// Cantieri
export function getCantieri(): Cantiere[] {
  const saved = getItem<Cantiere[] | null>(KEYS.cantieri, null);
  if (!saved) {
    setItem(KEYS.cantieri, CANTIERI_INIZIALI);
    return CANTIERI_INIZIALI;
  }
  return saved;
}

export function saveCantieri(list: Cantiere[]): void {
  setItem(KEYS.cantieri, list);
}

export function addCantiere(c: Cantiere): void {
  const list = getCantieri();
  list.push(c);
  saveCantieri(list);
}

export function updateCantiere(c: Cantiere): void {
  const list = getCantieri().map(x => x.id === c.id ? c : x);
  saveCantieri(list);
}

export function deleteCantiere(id: string): void {
  saveCantieri(getCantieri().filter(x => x.id !== id));
}

// Presenze
export function getPresenze(): Presenza[] {
  return getItem<Presenza[]>(KEYS.presenze, []);
}

export function savePresenze(list: Presenza[]): void {
  setItem(KEYS.presenze, list);
}

export function addPresenza(p: Presenza): void {
  const list = getPresenze();
  list.push(p);
  savePresenze(list);
}

export function updatePresenza(p: Presenza): void {
  savePresenze(getPresenze().map(x => x.id === p.id ? p : x));
}

export function deletePresenza(id: string): void {
  savePresenze(getPresenze().filter(x => x.id !== id));
}
