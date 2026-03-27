export interface Montatore {
  id: string;
  nome: string;
  cognome: string;
  ditta: string;
  tariffaOraria: number;
  tariffaViaggio: number;
}

export interface Cantiere {
  id: string;
  nome: string;
  cliente: string;
  kurzel: string; // abbreviazione per file Barth
}

export interface Presenza {
  id: string;
  data: string; // YYYY-MM-DD
  cantiereId: string;
  montatoreId: string;
  orelavoro: number;
  oreViaggio: number;
  hotel: number;
  pasti: number;
  varie: number;
  note: string;
  nrContratto: string;
}
