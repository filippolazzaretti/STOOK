export const STORAGE_KEYS = {
  preferredUniversity: 'stookPreferredUniversity'
};

export const UNIVERSITIES = [
  {
    id: 'cafoscari',
    label: "Universita Ca' Foscari - Venezia",
    audience: 'Studenti tra Venezia, Mestre e campus lagunari',
    headline: "Libri e appunti per i corsi di Ca' Foscari",
    description: 'Consulta annunci selezionati per area economica, linguistica e umanistica.',
    listings: [
      {
        title: 'Economia Aziendale - Manuale usato',
        detail: 'Edizione recente, ottimo stato, ritiro zona San Giobbe.'
      },
      {
        title: 'Linguistica Generale - appunti completi',
        detail: 'Materiale del secondo semestre condiviso da studenti cafoscarini.'
      },
      {
        title: 'Storia dell Arte Moderna - volume illustrato',
        detail: 'Perfetto per corsi umanistici, consegna a Venezia.'
      }
    ]
  },
  {
    id: 'iuav',
    label: 'IUAV - Venezia',
    audience: 'Studenti di architettura, design e pianificazione',
    headline: 'Annunci pensati per chi studia allo IUAV',
    description: 'Una selezione di testi e materiali piu utili per laboratori e progettazione.',
    listings: [
      {
        title: 'Manuale di progettazione architettonica',
        detail: 'Libro annotato con schemi utili, disponibile in zona Tolentini.'
      },
      {
        title: 'Storia del Design - copia seminuova',
        detail: 'Ideale per esami teorici, prezzo ridotto per studenti IUAV.'
      },
      {
        title: 'Kit tavole e materiali per laboratorio',
        detail: 'Set completo per corsi pratici del primo anno.'
      }
    ]
  },
  {
    id: 'trieste',
    label: 'Universita degli Studi di Trieste',
    audience: 'Studenti del polo universitario triestino',
    headline: 'Libri usati in evidenza per UniTS',
    description: 'Risultati orientati ai corsi piu cercati nelle sedi di Trieste.',
    listings: [
      {
        title: 'Analisi Matematica 1 - testo base',
        detail: 'Con esercizi svolti allegati, consegna in area centrale.'
      },
      {
        title: 'Diritto Privato - volume sottolineato',
        detail: 'Perfetto per ripasso veloce, prezzo contenuto.'
      },
      {
        title: 'Chimica Generale - appunti e formulario',
        detail: 'Raccolta pronta per sessione estiva.'
      }
    ]
  },
  {
    id: 'bologna',
    label: 'Alma Mater Studiorum - Universita di Bologna',
    audience: 'Studenti delle sedi Alma Mater',
    headline: 'Contenuti personalizzati per UniBo',
    description: 'Filtri pronti per mostrare annunci pertinenti ai corsi e alle sedi di Bologna.',
    listings: [
      {
        title: 'Istituzioni di Diritto Pubblico - usato',
        detail: 'Consegna tra via Zamboni e campus universitario.'
      },
      {
        title: 'Microeconomia - edizione 2024',
        detail: 'Libro pulito con copertina integra, disponibile subito.'
      },
      {
        title: 'Biologia Cellulare - appunti digitali + testo',
        detail: 'Pacchetto utile per studenti area scientifica.'
      }
    ]
  }
];

export function getUniversityById(universityId) {
  return UNIVERSITIES.find((university) => university.id === universityId) || null;
}

