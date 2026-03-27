'use client';

import { useState, useEffect } from 'react';
import { getMontatori, getCantieri, getPresenze, addPresenza, updatePresenza, deletePresenza } from '@/app/lib/storage';
import type { Montatore, Cantiere, Presenza } from '@/app/lib/types';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const EMPTY_ROW = {
  montatoreId: '',
  orelavoro: 0,
  oreViaggio: 0,
  hotel: 0,
  pasti: 0,
  varie: 0,
  note: '',
  nrContratto: '',
};

export default function InserimentoPage() {
  const [montatori, setMontatori] = useState<Montatore[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);

  // Form stato
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [cantiereId, setCantiereId] = useState('');
  const [righe, setRighe] = useState([{ ...EMPTY_ROW }]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const m = getMontatori();
    const c = getCantieri();
    setMontatori(m);
    setCantieri(c);
    if (c.length > 0) setCantiereId(c[0].id);
    setPresenze(getPresenze());
  }, []);

  function addRiga() {
    setRighe(r => [...r, { ...EMPTY_ROW }]);
  }

  function removeRiga(idx: number) {
    setRighe(r => r.filter((_, i) => i !== idx));
  }

  function updateRiga(idx: number, field: string, value: string | number) {
    setRighe(r => r.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  }

  function resetForm() {
    setData(new Date().toISOString().slice(0, 10));
    setCantiereId(cantieri[0]?.id || '');
    setRighe([{ ...EMPTY_ROW }]);
    setEditingId(null);
  }

  function handleSave() {
    const valide = righe.filter(r => r.montatoreId);
    if (!cantiereId || valide.length === 0) return;

    if (editingId) {
      // Aggiorna la prima presenza (editing singolo)
      const updated: Presenza = {
        id: editingId,
        data,
        cantiereId,
        ...valide[0],
      };
      updatePresenza(updated);
    } else {
      for (const r of valide) {
        addPresenza({ id: uid(), data, cantiereId, ...r });
      }
    }

    const updated = getPresenze();
    setPresenze(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    resetForm();
  }

  function handleEdit(p: Presenza) {
    setData(p.data);
    setCantiereId(p.cantiereId);
    setRighe([{
      montatoreId: p.montatoreId,
      orelavoro: p.orelavoro,
      oreViaggio: p.oreViaggio,
      hotel: p.hotel,
      pasti: p.pasti,
      varie: p.varie,
      note: p.note,
      nrContratto: p.nrContratto,
    }]);
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    if (!confirm('Eliminare questa registrazione?')) return;
    deletePresenza(id);
    setPresenze(getPresenze());
    if (editingId === id) resetForm();
  }

  const montatoreMap = new Map(montatori.map(m => [m.id, m]));
  const cantiereMap = new Map(cantieri.map(c => [c.id, c]));

  // Ultime presenze (30 più recenti)
  const ultimePresenze = [...presenze]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 50);

  return (
    <>
      <div className="page-header">
        <div />
        <h1 className="page-title">INSERIMENTO ORE</h1>
      </div>

      {saved && <div className="alert alert-success">Salvato con successo!</div>}

      <div className="form-card" style={{ maxWidth: '100%', marginBottom: 32 }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Data</label>
            <input
              type="date"
              className="form-input"
              value={data}
              onChange={e => setData(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cantiere</label>
            <select
              className="form-select"
              value={cantiereId}
              onChange={e => setCantiereId(e.target.value)}
            >
              <option value="">— seleziona —</option>
              {cantieri.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="montatori-list">
          {righe.map((riga, idx) => (
            <div key={idx} className="montatore-row">
              <div className="form-group">
                <label className="form-label">Montatore</label>
                <select
                  className="form-select"
                  value={riga.montatoreId}
                  onChange={e => updateRiga(idx, 'montatoreId', e.target.value)}
                >
                  <option value="">— seleziona —</option>
                  {montatori.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ore Lavoro</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={0.5}
                  value={riga.orelavoro}
                  onChange={e => updateRiga(idx, 'orelavoro', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ore Viaggio</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={0.5}
                  value={riga.oreViaggio}
                  onChange={e => updateRiga(idx, 'oreViaggio', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hotel €</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={riga.hotel}
                  onChange={e => updateRiga(idx, 'hotel', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pasti €</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={riga.pasti}
                  onChange={e => updateRiga(idx, 'pasti', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Varie €</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={riga.varie}
                  onChange={e => updateRiga(idx, 'varie', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nr. Contratto</label>
                <input
                  type="text"
                  className="form-input"
                  value={riga.nrContratto}
                  onChange={e => updateRiga(idx, 'nrContratto', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-label">&nbsp;</label>
                {righe.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeRiga(idx)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {!editingId && (
            <button className="btn btn-secondary" onClick={addRiga}>
              + Aggiungi montatore
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            {editingId ? 'Aggiorna' : 'Salva'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" onClick={resetForm}>Annulla</button>
          )}
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">Ultime registrazioni</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cantiere</th>
              <th>Montatore</th>
              <th>Ore Lav.</th>
              <th>Ore Viag.</th>
              <th>Hotel</th>
              <th>Pasti</th>
              <th>Varie</th>
              <th>Nr. Contratto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ultimePresenze.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">Nessuna registrazione ancora.</td>
              </tr>
            ) : (
              ultimePresenze.map(p => {
                const m = montatoreMap.get(p.montatoreId);
                const c = cantiereMap.get(p.cantiereId);
                return (
                  <tr key={p.id}>
                    <td>{p.data}</td>
                    <td>{c?.nome || '—'}</td>
                    <td>{m ? `${m.nome} ${m.cognome}`.trim() : '—'}</td>
                    <td>{p.orelavoro}</td>
                    <td>{p.oreViaggio}</td>
                    <td>{p.hotel > 0 ? `€ ${p.hotel}` : '—'}</td>
                    <td>{p.pasti > 0 ? `€ ${p.pasti}` : '—'}</td>
                    <td>{p.varie > 0 ? `€ ${p.varie}` : '—'}</td>
                    <td>{p.nrContratto || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Modifica</button>
                      {' '}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Elimina</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
