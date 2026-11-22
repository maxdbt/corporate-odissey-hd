# Bonus dedicati alla campagna HD

Stato locale del 22 novembre 2026: tutti i 19 stage hanno un bonus dedicato. Aggiunte 16 attività; conservati i sistemi di L’ultima mail, Ferie, ma non troppo e Caccia ai ricavi. La consegna Git al repository HD è autorizzata; nessun aggiornamento di Sites.

## Attività implementate

| Stage | Bonus | Regola effettiva |
| --- | --- | --- |
| 1-1 | L’ultima mail | Richieste e timbro A GENNAIO; regole e premi originali. |
| 1-2 | Ferie, ma non troppo | Schiva mail per 25 s, 3 vite, recupero per secondi completati. |
| 2-1 | Il vassoio impossibile | 25 secondi stabili di equilibrio entro 35 s; limite 35 s. |
| 3-1 | Questa call poteva essere una mail | 8 interventi nella fascia verde; limite 35 s. |
| 4-1 | L’indirizzo giusto | 5 abbinamenti di sede e civico; limite 40 s. |
| 4-2 | Nota spese express | 8 ricevute classificate: viaggio, pasti o duplicato; limite 40 s. |
| 4-3 | Quel bagaglio è mio! | 7 riconoscimenti tramite nome e numero su tre bagagli; limite 35 s. |
| 4-4 | Binario fantasma | 3 percorsi allineando i tre scambi; limite 40 s. |
| 4-5 | Turbolenza creativa | 22 secondi stabili entro 30 s; limite 30 s. |
| 4-6 | Carrozza del silenzio | 9 telefoni da silenziare prima della scadenza; limite 35 s. |
| 4-7 | Fata Morgana S.r.l. | 3 sequenze crescenti su una griglia di 9 caselle; limite 40 s. |
| 4-8 | Riunione sottozero | 3 circuiti allineando le sezioni; limite 40 s. |
| 4-9 | Connessione profonda | 3 impianti: valvole ai valori richiesti, 18 mosse per impianto; limite 40 s. |
| 4-10 | Lo scope invisibile | 6 confronti fra accordo e richiesta aggiunta; limite 40 s. |
| 5-1 | Caccia ai ricavi | Navicella R/C, EBITDA, 35 s e costi inseguitori negli ultimi 10 s; regole originali. |
| 5-2 | Team building obbligatorio | 3 sequenze crescenti di gesti; limite 40 s. |
| 5-3 | Agenda blindata | 6 slot liberi di 60 minuti fra impegni esistenti; limite 40 s. |
| 5-4 | Il golf del direttore | 3 centri con 5 palline: ferma la forza nella fascia verde; limite 40 s. |
| 5-5 | Fuori ufficio, finalmente | 7 anelli: controlla verticalmente l’aeroplanino; limite 35 s. |

Questa matrice sostituisce le proposte iniziali: agenda e bagagli sono prove di scelta a tocchi; il golf regola la forza e illustra la traiettoria, senza rimbalzi fra mobili. Il framework condivide dieci modalità, con obiettivi, istruzioni e grafica specifici.

## Accesso, pausa e premi

Nei nuovi stage platform un oggetto BONUS vicino all’ingresso si attiva con ↑ o tocco quando il protagonista è vicino. Nelle scene di destinazione, mezzo, volo, treno e cliente si usa il pulsante in basso a destra. Gli accessi dei tre bonus originali sono conservati. Nessun bonus sostituisce uscite, badge, piatti, acquisti o combattimenti obbligatori.

Il chiamante viene sospeso: timer, nemici ed eventi ripartono dalla stessa scena. P/Esc o il pulsante pausa fermano il minigioco; INVIO o RIPRENDI lo riavviano. TORNA abbandona senza penalità. La perdita di focus mette in pausa. Le scene statiche hanno una pausa propria.

Vincere una nuova attività assegna una sola volta **+10 salute, −10 stress, +15 euro**. Salute e stress rispettano i limiti di GameState. Gli euro del premio non attivano il recupero dei 100 euro raccolti. Fallimento e abbandono assegnano zero. Il tentativo si consuma all’ingresso e resta consumato dopo morte o checkpoint; si azzera con Nuova partita. Le anteprime non assegnano premi alla campagna. I tre bonus originali mantengono le proprie ricompense.

## Implementazione e verifica

StageBonusCatalog descrive gli stage; StageBonusRound gestisce le regole senza Phaser; StageBonusScene presenta istruzioni, gioco e risultato; StageBonusAccess sospende il chiamante; StageBonusRewards protegge il premio singolo. I test provano la vittoria di tutte le 16 attività con 12 semi ciascuna, pause, errori, limiti e premi. Nel browser sono stati verificati tutti gli ingressi di anteprima, il rientro in Mensa, la pausa prolungata e una scelta touch dell’agenda.

Vedi [porting completo](PORTING_CAMPAGNA_HD.md) per prove, limiti e URL. Le tavole in concepts sono concept illustrativi; le catture in screenshots mostrano il gioco reale.
