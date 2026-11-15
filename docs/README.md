# Corporate Odyssey

Corporate Odyssey è un platform 2D satirico ambientato nel mondo del lavoro. Il giocatore attraversa uffici, mensa, riunioni, trasferte e piani executive, gestendo salute mentale, stress, bonus e giorni di ferie. Il gioco gira nel browser con Phaser e include controlli touch e supporto PWA.

La baseline è la versione **0.9.9**, commit `abceb61`, analizzata il **15 novembre 2026**. Le modifiche locali aggiungono il porting HD giocabile del primo livello, con fondali realistici, asset illustrati e animazioni estese. Gli altri stage conservano il loro tema originale. La [pubblicazione su ChatGPT Sites](PUBBLICAZIONE_SITES.md) usa una copia separata della build: il repository GitHub non viene aggiornato.

## Documentazione

| Documento | Contenuto |
| --- | --- |
| [Analisi del progetto](ANALYSIS.md) | Struttura, flusso, meccaniche, stato delle verifiche e punti da affrontare |
| [Architettura](ARCHITECTURE.md) | Contratti tecnici di scene, entità, sistemi e dati, conservati dal progetto |
| [Sviluppo](DEVELOPMENT.md) | Installazione, comandi, controlli, build, pubblicazione e manutenzione |
| [Direzione artistica](ART_DIRECTION.md) | Riferimento grafico scelto e cinque proposte esplorate |
| [Porting HD implementato](PORTING_HD.md) | Componenti riutilizzabili, asset, animazioni, risoluzione e verifiche |
| [Prompt per il porting del primo livello](PROMPT_PORTING_LIVELLO_1.md) | Istruzioni operative complete per realizzare lo stile concordato su PC e mobile |
| [Indagine sul finale](SURVEY.md) | Registrazione locale delle scelte e configurazione dell'invio facoltativo |
| [Prompt delle immagini](concepts/PROMPTS.md) | Specifiche usate con ImageGen per le cinque tavole |
| [Bonus L'ultima mail](BONUS_ULTIMA_MAIL.md) | Documentazione del minigioco presente nelle altre modifiche locali |

## Avvio rapido

Dalla cartella del repository:

```powershell
npm ci
npm run dev
```

Vite usa la porta **8080**, apre il browser e abilita l'ascolto in rete tramite lo script `--host`. Se la porta è occupata può sceglierne un'altra: leggere l'indirizzo stampato nel terminale. Non occorrono backend, database o variabili d'ambiente per il gioco di base.

## Stack della versione analizzata

| Componente | Versione nel lockfile | Ruolo |
| --- | --- | --- |
| JavaScript | ES modules | Codice applicativo, senza compilazione TypeScript |
| Phaser | 3.90.0 | Scene, rendering, input, animazioni e fisica Arcade |
| Vite | 6.4.4 | Server di sviluppo e build statica |
| vite-plugin-pwa | 2.0.0 | Manifest e service worker |

Il workflow di pubblicazione usa Node.js **22**. Nel controllo locale sono stati usati Node.js **24.15.0** e npm **11.12.1**.

## Verifiche effettuate

Installazione con `npm ci`, build di produzione e generazione del service worker riuscite. Il menu, il briefing e l'avvio del livello 1-1 sono stati aperti nel browser; nei log raccolti durante questa prova non sono comparsi errori o avvisi. Questi controlli non costituiscono una prova completa di tutti i livelli o delle prestazioni su telefoni reali.

Per il porting sono stati aggiunti controlli automatici sugli atlanti e svolte prove di animazione, movimento, salto, input mobile simulato, ridimensionamento, fullscreen, ritorno al menu e avvio dello stage 1-2. I dettagli e i limiti sono in [PORTING_HD.md](PORTING_HD.md).
