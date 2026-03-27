'use client';
//Importiamo funzione useState
import {useState} from 'react';

export default function Note(){
    // Creiamo gli state
    const [nota,setNota] = useState(''); // Valore iniziale ''
    const [lista, setLista] = useState<string[]>([]); // Settiamo la lista dove staranno le note e gli diciamo che puo essere solo un array di string e inizzializziamolo a vuoto

    // Funzione che si attiva appena clicco salva
    function handleSalva() {
        if (!nota.trim()) return; // Controlla che non sia vuota

        setLista(prev => [...prev, nota]); // prende quello che c'era prima (se esisteva) salvandolo in prev e poi aggiunge la nota
        setNota(''); // Rimette l'input vuoto
    }


return (
  <section>
    <h1>NOTE</h1>

    <input
      className="form-input"
      placeholder="Scrivi una nota..."
      value={nota}
      // e è un evento contiene tutte le info su cosa è successo , target è l'elemento che ha generato il cambiamento in questo caso <input>
      onChange={(e) => setNota(e.target.value)} //Ogni volta che l’utente scrive nell’input, salva quello che scrive nello state nota.
      // se scrivo CIAO e.target.value = "CIAO";
    />

    <button className="btn btn-primary" onClick={handleSalva}>
      SALVA
    </button>

    <ul>
        {lista.map((n, i) => (
            <li key={i}>{n}</li>
        ))}
    </ul>
  </section>
);


    
}