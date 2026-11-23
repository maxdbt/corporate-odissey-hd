# Corporate Odyssey — documentazione

Aggiornamento: **23 novembre 2026**. Platform satirico 2D per browser desktop e mobile, con **19 stage HD e otto nuovi minigiochi**. Lo stile di riferimento resta il concept illustrato approvato. Il repository di consegna è `maxdbt/corporate-odissey-hd` sul remoto `max-hd`; il sito ha un repository tecnico separato.

## Stato e gioco

- [Campagna completa](PORTING_CAMPAGNA_HD.md): matrice dei 19 stage, scene e prove della campagna.
- [Animazioni HD e mezzi](ANIMAZIONI_HD.md): cicli attuali, boss, costumi da sub, personaggi a bordo e manutenzione.
- [Musica, jingle ed effetti](AUDIO.md): integrati nel gioco locale, con 19 temi di livello, varianti per boss e bonus, sblocco al primo comando, mix e anteprima d’ascolto.
- [Introduzioni animate](INTRODUZIONI_ANIMATE.md): cinque mondi, dieci clip da 15 secondi con Jack/Wendy e voci italiane, integrate localmente nel gioco.
- [Minigiochi aggiornati](REVISIONE_MINIGIOCHI.md): otto nuove attività, accessi nella campagna, controlli e verifiche.
- [Fuga dalla festa aziendale](FUGA_FESTA_HD.md): salone HD, 24 colleghi distinti e animati, obiettivi distanti e cappotto indossabile.
- [Ferie, ma non troppo](FERIE_PEDALO_ARCADE.md): fuga in pedalò a schermo pieno, onde, combo e inseguimento del capo.
- [L'indirizzo giusto](TAXI_CITTA_HD.md): città HD esplorabile, traffico e passanti.
- [Bonus per livello](BONUS_PER_LIVELLO.md): catalogo attuale e ritiro dei vecchi giochi.
- [Stato sintetico](CAMPAGNA_HD_STATO.md).
- [Pubblicazione Sites](PUBBLICAZIONE_SITES.md): sito pubblico, destinazioni Git e procedura di rilascio.

## Sviluppo

- [Sviluppo e comandi](DEVELOPMENT.md).
- [Architettura](ARCHITECTURE.md).
- [Analisi iniziale della versione 0.9.9](ANALYSIS.md): documento di baseline, precedente al porting completo.
- [Indagine finale](SURVEY.md): raccolta locale delle scelte e invio facoltativo.

```powershell
npm ci
npm run dev
node --test tests/*.test.js
npm run build
```

Il server Vite usa la porta 8080; leggere l'indirizzo effettivo nel terminale. Non sono richiesti backend o credenziali per giocare. Stack: JavaScript ES modules, Phaser 3.90.0, Vite 6.4.4, vite-plugin-pwa 2.0.0.

## Grafica e archivio delle consegne

- [Direzione artistica](ART_DIRECTION.md).
- [Porting iniziale del primo stage](PORTING_HD.md) e [porting Estate d'Inferno](PORTING_ESTATE.md): documenti delle consegne precedenti; i conteggi di animazione correnti sono in ANIMAZIONI_HD.
- [Prompt del primo livello](PROMPT_PORTING_LIVELLO_1.md) e [prompt dei livelli successivi](PROMPT_PORTING_LIVELLI_SUCCESSIVI.md).
- [Prompt dei concept](concepts/PROMPTS.md), [campagna](concepts/PROMPTS-CAMPAGNA-HD.md), [animazioni e mezzi](concepts/PROMPTS-ANIMAZIONI-HD.md).
- [Concept Estate e Ferie](concepts/ESTATE-INFERNO.md).
- [Bonus L'ultima mail](BONUS_ULTIMA_MAIL.md): documento storico; questo minigioco non è più accessibile.

I documenti sono organizzati tramite questo indice, mantenendo i percorsi esistenti per conservare validi i collegamenti. Concept illustrativi, screenshot del gioco e resoconti di collaudo sono distinti.

## Verifica

La copertura automatica include atlanti, cicli, boss, mezzi, bonus, pause, premi, gestione audio e introduzioni dei cinque mondi con Jack/Wendy. Le prove browser e i loro limiti sono riportati nei documenti di campagna, animazioni, [audio](AUDIO.md#verifiche) e [introduzioni animate](INTRODUZIONI_ANIMATE.md#verifica). Il viewport mobile simulato verifica disposizione e input: prestazioni, memoria, temperatura, multitouch e resa sonora su telefono fisico richiedono un collaudo hardware.
