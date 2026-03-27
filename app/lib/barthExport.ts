import * as XLSX from 'xlsx';
import type { Presenza, Montatore, Cantiere } from './types';

interface BarthRow {
  datum: string;
  cliente: string;
  kurzel: string;
  monteurs: Array<{ oreViaggio: number; oreMontaggio: number; nome: string }>;
  km: number;
  pranzi: number;
  cena: number;
  hotel: number;
  sonstiges: number;
}

function buildBarthRows(
  presenze: Presenza[],
  montatori: Montatore[],
  cantieri: Cantiere[]
): BarthRow[] {
  const montatoreMap = new Map(montatori.map(m => [m.id, m]));
  const cantiereMap = new Map(cantieri.map(c => [c.id, c]));

  // Raggruppa per data + cantiere
  const byDayMap = new Map<string, Presenza[]>();
  for (const p of presenze) {
    const key = `${p.data}__${p.cantiereId}`;
    if (!byDayMap.has(key)) byDayMap.set(key, []);
    byDayMap.get(key)!.push(p);
  }

  const rows: BarthRow[] = [];
  const sortedKeys = [...byDayMap.keys()].sort();

  for (const key of sortedKeys) {
    const group = byDayMap.get(key)!;
    const cantiere = cantiereMap.get(group[0].cantiereId);
    const [year, month, day] = group[0].data.split('-');
    const datum = `${day}.${month}.${year}`;

    const monteurs = group.slice(0, 6).map(p => {
      const m = montatoreMap.get(p.montatoreId);
      return {
        oreViaggio: p.oreViaggio,
        oreMontaggio: p.orelavoro,
        nome: m ? `${m.nome} ${m.cognome}`.trim() : '',
      };
    });

    const totalHotel = group.reduce((s, p) => s + p.hotel, 0);
    const totalPasti = group.reduce((s, p) => s + p.pasti, 0);
    const totalVarie = group.reduce((s, p) => s + p.varie, 0);

    rows.push({
      datum,
      cliente: cantiere?.cliente || cantiere?.nome || '',
      kurzel: cantiere?.kurzel || '',
      monteurs,
      km: 0,
      pranzi: totalPasti,
      cena: 0,
      hotel: totalHotel,
      sonstiges: totalVarie,
    });
  }

  return rows;
}

function writeSheet(
  ws: XLSX.WorkSheet,
  rows: BarthRow[],
  companyName: string,
  stundensatz: number,
  mese: string
): void {
  const LUNCH_RATE = 25;
  const DINNER_RATE = 25;
  const KM_RATE = 0.68;

  // Riga 1: titolo
  XLSX.utils.sheet_add_aoa(ws, [[companyName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']], { origin: 'A1' });
  // Riga 2: mese
  XLSX.utils.sheet_add_aoa(ws, [[`Mese: ${mese}`]], { origin: 'A2' });
  // Riga 3: nomi montatori (placeholder, si aggiorna con dati)
  const nameRow: (string | number)[] = ['', '', ''];
  for (let i = 0; i < 6; i++) {
    const nome = rows.flatMap(r => r.monteurs[i] ? [r.monteurs[i].nome] : [])[0] || `Monteur ${i + 1}`;
    nameRow.push(nome, nome);
  }
  XLSX.utils.sheet_add_aoa(ws, [nameRow], { origin: 'A3' });

  // Riga 4: tariffe
  const rateRow: (string | number)[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', LUNCH_RATE, DINNER_RATE, '', '', '', stundensatz, stundensatz, '', KM_RATE, '', '', ''];
  XLSX.utils.sheet_add_aoa(ws, [rateRow], { origin: 'A4' });

  // Riga 5: intestazioni colonne
  const headers = [
    'Datum', 'Cliente', 'Kürzel',
    'ore viaggio', 'ore montaggio',
    'ore viaggio', 'ore montaggio',
    'ore viaggio', 'ore montaggio',
    'ore viaggio', 'ore montaggio',
    'ore viaggio', 'ore montaggio',
    'ore viaggio', 'ore montaggio',
    'ore viaggio totale', 'ore montaggio totale',
    'KM', 'pranzi', 'cena',
    'Pauschale Mittagessen', 'Pauschale Abendessen',
    'Material', 'Hotel', 'Sonstiges',
    'Summe Kosten ore viaggio', 'Summe Kosten ore montaggio', 'Summe',
    'Preis Km', 'Summe KM', 'Gesamt Spesen', 'Gesamt'
  ];
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A5' });

  // Righe dati
  let rowIdx = 6;
  for (const row of rows) {
    const totalViaggio = row.monteurs.reduce((s, m) => s + m.oreViaggio, 0);
    const totalMontaggio = row.monteurs.reduce((s, m) => s + m.oreMontaggio, 0);
    const costoViaggio = totalViaggio * stundensatz;
    const costoMontaggio = totalMontaggio * stundensatz;
    const summeOre = costoViaggio + costoMontaggio;
    const summeKm = row.km * KM_RATE;
    const gesamtSpesen = row.pranzi * LUNCH_RATE + row.cena * DINNER_RATE + row.hotel + row.sonstiges + summeKm;
    const gesamt = summeOre + gesamtSpesen;

    const dataRow: (string | number)[] = [
      row.datum, row.cliente, row.kurzel,
    ];
    for (let i = 0; i < 6; i++) {
      dataRow.push(row.monteurs[i]?.oreViaggio ?? 0);
      dataRow.push(row.monteurs[i]?.oreMontaggio ?? 0);
    }
    dataRow.push(
      totalViaggio, totalMontaggio,
      row.km, row.pranzi, row.cena,
      0, 0, // Pauschale calcolate dopo
      0, // Material
      row.hotel,
      row.sonstiges,
      costoViaggio, costoMontaggio, summeOre,
      KM_RATE, summeKm, gesamtSpesen, gesamt
    );

    XLSX.utils.sheet_add_aoa(ws, [dataRow], { origin: `A${rowIdx}` });
    rowIdx++;
  }

  // Riga totali
  const totRow: (string | number)[] = ['TOTALE', '', ''];
  for (let i = 0; i < 6; i++) {
    totRow.push(
      rows.reduce((s, r) => s + (r.monteurs[i]?.oreViaggio ?? 0), 0),
      rows.reduce((s, r) => s + (r.monteurs[i]?.oreMontaggio ?? 0), 0)
    );
  }
  const totViaggio = rows.reduce((s, r) => s + r.monteurs.reduce((ss, m) => ss + m.oreViaggio, 0), 0);
  const totMontaggio = rows.reduce((s, r) => s + r.monteurs.reduce((ss, m) => ss + m.oreMontaggio, 0), 0);
  totRow.push(
    totViaggio, totMontaggio,
    rows.reduce((s, r) => s + r.km, 0),
    rows.reduce((s, r) => s + r.pranzi, 0),
    rows.reduce((s, r) => s + r.cena, 0),
    0, 0, 0,
    rows.reduce((s, r) => s + r.hotel, 0),
    rows.reduce((s, r) => s + r.sonstiges, 0),
    totViaggio * stundensatz,
    totMontaggio * stundensatz,
    (totViaggio + totMontaggio) * stundensatz,
    KM_RATE,
    rows.reduce((s, r) => s + r.km, 0) * KM_RATE,
    0, 0
  );
  XLSX.utils.sheet_add_aoa(ws, [totRow], { origin: `A${rowIdx}` });
}

export function exportBarth(
  presenze: Presenza[],
  montatori: Montatore[],
  cantieri: Cantiere[],
  mese: string
): void {
  const wb = XLSX.utils.book_new();

  const rows = buildBarthRows(presenze, montatori, cantieri);

  const ws1 = XLSX.utils.aoa_to_sheet([]);
  writeSheet(ws1, rows, 'Anthony Contrafatto', 69, mese);
  XLSX.utils.book_append_sheet(wb, ws1, 'Foglio');

  const ws2 = XLSX.utils.aoa_to_sheet([]);
  writeSheet(ws2, rows, 'Quercus S.r.l.', 30, mese);
  XLSX.utils.book_append_sheet(wb, ws2, 'MONTATORI');

  XLSX.writeFile(wb, `File_Barth_${mese.replace(' ', '_')}.xlsx`);
}
