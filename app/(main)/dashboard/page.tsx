'use client';

import { useState, useEffect, useMemo } from 'react';
import { getMontatori, getCantieri, getPresenze } from '@/app/lib/storage';
import type { Montatore, Cantiere, Presenza } from '@/app/lib/types';

function getMesiDisponibili(presenze: Presenza[]): string[] {
  const set = new Set<string>();
  for (const p of presenze) {
    const [y, m] = p.data.split('-');
    set.add(`${y}-${m}`);
  }
  const arr = [...set].sort().reverse();
  // Aggiungi mese corrente se non presente
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!set.has(current)) arr.unshift(current);
  return arr;
}

function formatMese(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default function DashboardPage() {
  const [montatori, setMontatori] = useState<Montatore[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [meseSel, setMeseSel] = useState('');
  const [cantiereSel, setCantiereSel] = useState('tutti');

  useEffect(() => {
    setMontatori(getMontatori());
    setCantieri(getCantieri());
    const p = getPresenze();
    setPresenze(p);

    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMeseSel(current);
  }, []);

  const mesi = useMemo(() => getMesiDisponibili(presenze), [presenze]);

  const presenzeFiltered = useMemo(() => {
    return presenze.filter(p => {
      const [y, m] = p.data.split('-');
      const ym = `${y}-${m}`;
      const matchMese = ym === meseSel;
      const matchCantiere = cantiereSel === 'tutti' || p.cantiereId === cantiereSel;
      return matchMese && matchCantiere;
    });
  }, [presenze, meseSel, cantiereSel]);

  const montatoreMap = useMemo(() => new Map(montatori.map(m => [m.id, m])), [montatori]);
  const cantiereMap = useMemo(() => new Map(cantieri.map(c => [c.id, c])), [cantieri]);

  // Statistiche aggregate per montatore
  const statsPerMontatore = useMemo(() => {
    const map = new Map<string, { oreLavoro: number; oreViaggio: number; hotel: number; pasti: number; varie: number }>();
    for (const p of presenzeFiltered) {
      if (!map.has(p.montatoreId)) {
        map.set(p.montatoreId, { oreLavoro: 0, oreViaggio: 0, hotel: 0, pasti: 0, varie: 0 });
      }
      const s = map.get(p.montatoreId)!;
      s.oreLavoro += p.orelavoro;
      s.oreViaggio += p.oreViaggio;
      s.hotel += p.hotel;
      s.pasti += p.pasti;
      s.varie += p.varie;
    }
    return map;
  }, [presenzeFiltered]);

  const personeImpiegate = statsPerMontatore.size;

  const costoTotale = useMemo(() => {
    let tot = 0;
    for (const [mid, stats] of statsPerMontatore) {
      const m = montatoreMap.get(mid);
      if (!m) continue;
      tot += stats.oreLavoro * m.tariffaOraria;
      tot += stats.oreViaggio * m.tariffaViaggio;
      tot += stats.hotel + stats.pasti + stats.varie;
    }
    return tot;
  }, [statsPerMontatore, montatoreMap]);

  const righe = useMemo(() => {
    return [...statsPerMontatore.entries()].map(([mid, stats]) => {
      const m = montatoreMap.get(mid);
      return {
        nome: m ? `${m.nome} ${m.cognome}`.trim() : mid,
        ...stats,
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [statsPerMontatore, montatoreMap]);

  return (
    <>
      <div className="page-header">
        <div />
        <h1 className="page-title">DASHBOARD</h1>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <span className="filter-label">Mese</span>
          <select
            className="filter-select"
            value={meseSel}
            onChange={e => setMeseSel(e.target.value)}
          >
            {mesi.map(m => (
              <option key={m} value={m}>{formatMese(m)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Cantiere</span>
          <select
            className="filter-select"
            value={cantiereSel}
            onChange={e => setCantiereSel(e.target.value)}
          >
            <option value="tutti">Tutti</option>
            {cantieri.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Persone Impiegate</p>
          <p className="stat-value">{personeImpiegate}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Costo Totale Cantiere</p>
          <p className="stat-value">€ {costoTotale.toLocaleString('it-IT')}</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">Panoramica</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ore Lavoro</th>
              <th>Ore Viaggio</th>
              <th>Hotel</th>
              <th>Pasti</th>
              <th>Varie</th>
            </tr>
          </thead>
          <tbody>
            {righe.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  Nessun dato per il periodo selezionato.<br />
                  Inserisci le ore dalla sezione "Inserimento ore".
                </td>
              </tr>
            ) : (
              righe.map(r => (
                <tr key={r.nome}>
                  <td>{r.nome}</td>
                  <td>{r.oreLavoro}</td>
                  <td>{r.oreViaggio}</td>
                  <td>{r.hotel > 0 ? `€ ${r.hotel}` : '—'}</td>
                  <td>{r.pasti > 0 ? `€ ${r.pasti}` : '—'}</td>
                  <td>{r.varie > 0 ? `€ ${r.varie}` : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
