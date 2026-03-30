'use client';

import { useState, useEffect, useMemo } from 'react';
import { getMontatori, getCantieri, getPresenze } from '@/app/lib/storage';
import { exportBarth } from '@/app/lib/barthExport';
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

export default function BarthPage() {
  const [montatori, setMontatori] = useState<Montatore[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [meseSel, setMeseSel] = useState('');
  const [cantiereSel, setCantiereSel] = useState('tutti');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMontatori(getMontatori());
    setCantieri(getCantieri());
    const p = getPresenze();
    setPresenze(p);
    const now = new Date();
    setMeseSel(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const mesi = useMemo(() => getMesi(presenze), [presenze]);

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

  // Anteprima raggruppata per data
  const anteprima = useMemo(() => {
    const byDay = new Map<string, Presenza[]>();
    for (const p of presenzeFiltered) {
      if (!byDay.has(p.data)) byDay.set(p.data, []);
      byDay.get(p.data)!.push(p);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [presenzeFiltered]);

  function handleExport() {
    setExporting(true);
    try {
      exportBarth(presenzeFiltered, montatori, cantieri, formatMese(meseSel));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div />
        <h1 className="page-title">FILE BARTH</h1>
      </div>

      <div className="filters-row" style={{ marginBottom: 32 }}>
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
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <span className="filter-label">&nbsp;</span>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || presenzeFiltered.length === 0}
          >
            {exporting ? 'Generando...' : '⬇ Scarica File Barth'}
          </button>
        </div>
      </div>

      {presenzeFiltered.length === 0 ? (
        <div className="form-card">
          <p className="empty-state" style={{ padding: 0 }}>
            Nessun dato per il periodo selezionato.<br />
            Inserisci le ore dalla sezione "Inserimento ore" prima di esportare.
          </p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-card-header">
            Anteprima — {formatMese(meseSel)} — {presenzeFiltered.length} registrazioni in {anteprima.length} giornate
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cantiere</th>
                <th>Montatori</th>
                <th>Tot. Ore Lavoro</th>
                <th>Tot. Ore Viaggio</th>
                <th>Hotel</th>
                <th>Pasti</th>
              </tr>
            </thead>
            <tbody>
              {anteprima.map(([data, group]) => {
                const cantiere = cantiereMap.get(group[0].cantiereId);
                return (
                  <tr key={data}>
                    <td>{data}</td>
                    <td>{cantiere?.nome || '—'}</td>
                    <td>
                      {group.map(p => {
                        const m = montatoreMap.get(p.montatoreId);
                        return m ? `${m.nome} ${m.cognome}`.trim() : '—';
                      }).join(', ')}
                    </td>
                    <td>{group.reduce((s, p) => s + p.orelavoro, 0)}</td>
                    <td>{group.reduce((s, p) => s + p.oreViaggio, 0)}</td>
                    <td>{group.reduce((s, p) => s + p.hotel, 0) || '—'}</td>
                    <td>{group.reduce((s, p) => s + p.pasti, 0) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: '#ebebeb', borderRadius: 6, border: '1px solid #d0d0d0', fontSize: 12, color: '#666' }}>
        <strong>Note sul file generato:</strong> Il file contiene 2 fogli — <em>Foglio</em> (Anthony Contrafatto, 69€/h) e <em>MONTATORI</em> (Quercus S.r.l., 30€/h).
        Ogni riga corrisponde a una giornata, con massimo 6 montatori per riga.
        Le colonne KM e Material devono essere completate manualmente se necessario.
      </div>
    </>
  );
}
