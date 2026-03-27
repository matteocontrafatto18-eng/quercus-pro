'use client';

import { useState, useEffect } from 'react';
import {
  getMontatori, saveMontatori, addMontatore, updateMontatore, deleteMontatore,
  getCantieri, saveCantieri, addCantiere, updateCantiere, deleteCantiere,
} from '@/app/lib/storage';
import type { Montatore, Cantiere } from '@/app/lib/types';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const EMPTY_MONTATORE: Omit<Montatore, 'id'> = {
  nome: '', cognome: '', ditta: 'Quercus S.r.l.', tariffaOraria: 18, tariffaViaggio: 18,
};

const EMPTY_CANTIERE: Omit<Cantiere, 'id'> = {
  nome: '', cliente: '', kurzel: '',
};

export default function AnagrafichePage() {
  const [tab, setTab] = useState<'montatori' | 'cantieri'>('montatori');
  const [montatori, setMontatori] = useState<Montatore[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);

  // Form montatore
  const [formM, setFormM] = useState<Omit<Montatore, 'id'>>({ ...EMPTY_MONTATORE });
  const [editMId, setEditMId] = useState<string | null>(null);
  const [showFormM, setShowFormM] = useState(false);

  // Form cantiere
  const [formC, setFormC] = useState<Omit<Cantiere, 'id'>>({ ...EMPTY_CANTIERE });
  const [editCId, setEditCId] = useState<string | null>(null);
  const [showFormC, setShowFormC] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMontatori(getMontatori());
    setCantieri(getCantieri());
  }, []);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Montatori handlers
  function handleSaveMontatore() {
    if (!formM.nome.trim()) return;
    if (editMId) {
      updateMontatore({ id: editMId, ...formM });
    } else {
      addMontatore({ id: uid(), ...formM });
    }
    setMontatori(getMontatori());
    setFormM({ ...EMPTY_MONTATORE });
    setEditMId(null);
    setShowFormM(false);
    flashSaved();
  }

  function handleEditMontatore(m: Montatore) {
    setFormM({ nome: m.nome, cognome: m.cognome, ditta: m.ditta, tariffaOraria: m.tariffaOraria, tariffaViaggio: m.tariffaViaggio });
    setEditMId(m.id);
    setShowFormM(true);
  }

  function handleDeleteMontatore(id: string) {
    if (!confirm('Eliminare questo montatore?')) return;
    deleteMontatore(id);
    setMontatori(getMontatori());
  }

  // Cantieri handlers
  function handleSaveCantiere() {
    if (!formC.nome.trim()) return;
    if (editCId) {
      updateCantiere({ id: editCId, ...formC });
    } else {
      addCantiere({ id: uid(), ...formC });
    }
    setCantieri(getCantieri());
    setFormC({ ...EMPTY_CANTIERE });
    setEditCId(null);
    setShowFormC(false);
    flashSaved();
  }

  function handleEditCantiere(c: Cantiere) {
    setFormC({ nome: c.nome, cliente: c.cliente, kurzel: c.kurzel });
    setEditCId(c.id);
    setShowFormC(true);
  }

  function handleDeleteCantiere(id: string) {
    if (!confirm('Eliminare questo cantiere?')) return;
    deleteCantiere(id);
    setCantieri(getCantieri());
  }

  return (
    <>
      <div className="page-header">
        <div />
        <h1 className="page-title">ANAGRAFICHE</h1>
      </div>

      {saved && <div className="alert alert-success">Salvato!</div>}

      <div className="tabs">
        <button
          className={`tab ${tab === 'montatori' ? 'tab-active' : ''}`}
          onClick={() => setTab('montatori')}
        >
          Montatori ({montatori.length})
        </button>
        <button
          className={`tab ${tab === 'cantieri' ? 'tab-active' : ''}`}
          onClick={() => setTab('cantieri')}
        >
          Cantieri ({cantieri.length})
        </button>
      </div>

      {tab === 'montatori' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => { setFormM({ ...EMPTY_MONTATORE }); setEditMId(null); setShowFormM(true); }}
            >
              + Nuovo Montatore
            </button>
          </div>

          {showFormM && (
            <div className="form-card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>
                {editMId ? 'Modifica Montatore' : 'Nuovo Montatore'}
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    className="form-input"
                    value={formM.nome}
                    onChange={e => setFormM(f => ({ ...f, nome: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cognome</label>
                  <input
                    className="form-input"
                    value={formM.cognome}
                    onChange={e => setFormM(f => ({ ...f, cognome: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ditta</label>
                  <input
                    className="form-input"
                    value={formM.ditta}
                    onChange={e => setFormM(f => ({ ...f, ditta: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tariffa Oraria €/h</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formM.tariffaOraria}
                    onChange={e => setFormM(f => ({ ...f, tariffaOraria: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tariffa Viaggio €/h</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formM.tariffaViaggio}
                    onChange={e => setFormM(f => ({ ...f, tariffaViaggio: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSaveMontatore}>Salva</button>
                <button className="btn btn-secondary" onClick={() => { setShowFormM(false); setEditMId(null); }}>Annulla</button>
              </div>
            </div>
          )}

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>Ditta</th>
                  <th>Tariffa Lavoro</th>
                  <th>Tariffa Viaggio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {montatori.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nessun montatore.</td></tr>
                ) : (
                  montatori.map(m => (
                    <tr key={m.id}>
                      <td>{m.nome}</td>
                      <td>{m.cognome}</td>
                      <td>{m.ditta}</td>
                      <td>€ {m.tariffaOraria}/h</td>
                      <td>€ {m.tariffaViaggio}/h</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditMontatore(m)}>Modifica</button>
                        {' '}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMontatore(m.id)}>Elimina</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'cantieri' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => { setFormC({ ...EMPTY_CANTIERE }); setEditCId(null); setShowFormC(true); }}
            >
              + Nuovo Cantiere
            </button>
          </div>

          {showFormC && (
            <div className="form-card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>
                {editCId ? 'Modifica Cantiere' : 'Nuovo Cantiere'}
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome Cantiere *</label>
                  <input
                    className="form-input"
                    value={formC.nome}
                    onChange={e => setFormC(f => ({ ...f, nome: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <input
                    className="form-input"
                    value={formC.cliente}
                    onChange={e => setFormC(f => ({ ...f, cliente: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kürzel (codice Barth)</label>
                  <input
                    className="form-input"
                    value={formC.kurzel}
                    placeholder="es. VAN"
                    onChange={e => setFormC(f => ({ ...f, kurzel: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSaveCantiere}>Salva</button>
                <button className="btn btn-secondary" onClick={() => { setShowFormC(false); setEditCId(null); }}>Annulla</button>
              </div>
            </div>
          )}

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cliente</th>
                  <th>Kürzel</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cantieri.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">Nessun cantiere.</td></tr>
                ) : (
                  cantieri.map(c => (
                    <tr key={c.id}>
                      <td>{c.nome}</td>
                      <td>{c.cliente || '—'}</td>
                      <td><span className="badge">{c.kurzel || '—'}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditCantiere(c)}>Modifica</button>
                        {' '}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCantiere(c.id)}>Elimina</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
