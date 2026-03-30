'use client';

import { useState, useEffect, useMemo } from 'react';
import { getMontatori, getCantieri, getPresenze } from '@/app/lib/storage';
import type { Montatore, Cantiere, Presenza } from '@/app/lib/types';

function getMesi(presenze: Presenza[]): string[] {
  const set = new Set<string>();
  for (const p of presenze) {
    const [y, m] = p.data.split('-');
    set.add(`${y}-${m}`);
  }
  const arr = [...set].sort().reverse();
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

export default function RiepilogoPage() {
  const [montatori, setMontatori] = useState<Montatore[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [meseSel, setMeseSel] = useState('');

  useEffect(() => {
    setMontatori(getMontatori());
    setCantieri(getCantieri());
    const p = getPresenze();
    setPresenze(p);
    const now = new Date();
    setMeseSel(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const mesi = useMemo(() => getMesi(presenze), [presenze]);

  const presenzeDelMese = useMemo(() => {
    return presenze.filter(p => {
      const [y, m] = p.data.split('-');
      return `${y}-${m}` === meseSel;
    });
  }, [presenze, meseSel]);

  const montatoreMap = useMemo(() => new Map(montatori.map(m => [m.id, m])), [montatori]);
  const cantiereMap = useMemo(() => new Map(cantieri.map(c => [c.id, c])), [cantieri]);

  const riepilogo = useMemo(() => {
    const map = new Map<string, {
      oreLavoro: number;
      oreViaggio: number;
      hotel: number;
      pasti: number;
      varie: number;
      totaleLavoro: number;
      rimborsoSpese: number;
      totale: number;
      cantieri: Set<string>;
    }>();

    for (const p of presenzeDelMese) {
      if (!map.has(p.montatoreId)) {
        map.set(p.montatoreId, {
          oreLavoro: 0,
          oreViaggio: 0,
          hotel: 0,
          pasti: 0,
          varie: 0,
          totaleLavoro: 0,
          rimborsoSpese: 0,
          totale: 0,
          cantieri: new Set(),
        });
      }
      const s = map.get(p.montatoreId)!;
      s.oreLavoro += p.orelavoro;
      s.oreViaggio += p.oreViaggio;
      s.hotel += p.hotel;
      s.pasti += p.pasti;
      s.varie += p.varie;
      s.cantieri.add(p.cantiereId);
    }

    // Calcola totali con tariffa
    const righe = [];
    for (const [mid, s] of map) {
      const m = montatoreMap.get(mid);
      if (!m) continue;
      const totaleLavoro = (s.oreLavoro * m.tariffaOraria) + (s.oreViaggio * m.tariffaViaggio);
      const rimborsoSpese = s.hotel + s.pasti + s.varie;
      const totale = totaleLavoro + rimborsoSpese;
      righe.push({
        id: mid,
        nome: `${m.nome} ${m.cognome}`.trim(),
        ditta: m.ditta,
        oreLavoro: s.oreLavoro,
        oreViaggio: s.oreViaggio,
        hotel: s.hotel,
        pasti: s.pasti,
        varie: s.varie,
        tariffaOraria: m.tariffaOraria,
        tariffaViaggio: m.tariffaViaggio,
        totaleLavoro,
        rimborsoSpese,
        totale,
        cantieri: [...s.cantieri].map(cid => cantiereMap.get(cid)?.nome || cid).join(', '),
      });
    }

    return righe.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [presenzeDelMese, montatoreMap, cantiereMap]);

  const totaliGenerali = useMemo(() => ({
    oreLavoro: riepilogo.reduce((s, r) => s + r.oreLavoro, 0),
    oreViaggio: riepilogo.reduce((s, r) => s + r.oreViaggio, 0),
    totaleLavoro: riepilogo.reduce((s, r) => s + r.totaleLavoro, 0),
    rimborsoSpese: riepilogo.reduce((s, r) => s + r.rimborsoSpese, 0),
    totale: riepilogo.reduce((s, r) => s + r.totale, 0),
  }), [riepilogo]);

  return (
    <>
      <div className="page-header">
        <div />
        <h1 className="page-title">RIEPILOGO INTERNO</h1>
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
      </div>

      <div className="table-card">
        <div className="table-card-header">
          Riepilogo paghe — {formatMese(meseSel)}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Montatore</th>
              <th>Cantieri</th>
              <th>Ore Lavoro</th>
              <th>Ore Viaggio</th>
              <th>Tariffa €/h</th>
              <th>Totale Lavoro</th>
              <th>Hotel</th>
              <th>Pasti</th>
              <th>Varie</th>
              <th>Rimborso Spese</th>
              <th>TOT. SUO AVERE</th>
            </tr>
          </thead>
          <tbody>
            {riepilogo.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-state">
                  Nessun dato per {formatMese(meseSel)}.
                </td>
              </tr>
            ) : (
              <>
                {riepilogo.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.nome}</td>
                    <td>{r.cantieri}</td>
                    <td>{r.oreLavoro}</td>
                    <td>{r.oreViaggio}</td>
                    <td>€ {r.tariffaOraria}</td>
                    <td>€ {r.totaleLavoro.toLocaleString('it-IT')}</td>
                    <td>{r.hotel > 0 ? `€ ${r.hotel}` : '—'}</td>
                    <td>{r.pasti > 0 ? `€ ${r.pasti}` : '—'}</td>
                    <td>{r.varie > 0 ? `€ ${r.varie}` : '—'}</td>
                    <td>€ {r.rimborsoSpese.toLocaleString('it-IT')}</td>
                    <td style={{ fontWeight: 700 }}>€ {r.totale.toLocaleString('it-IT')}</td>
                  </tr>
                ))}
                <tr style={{ background: '#cccccc', fontWeight: 700 }}>
                  <td>TOTALI</td>
                  <td></td>
                  <td>{totaliGenerali.oreLavoro}</td>
                  <td>{totaliGenerali.oreViaggio}</td>
                  <td></td>
                  <td>€ {totaliGenerali.totaleLavoro.toLocaleString('it-IT')}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>€ {totaliGenerali.rimborsoSpese.toLocaleString('it-IT')}</td>
                  <td>€ {totaliGenerali.totale.toLocaleString('it-IT')}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
