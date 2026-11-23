# Pubblicazione su ChatGPT Sites

Sito pubblico: [Corporate Odyssey HD](https://corporate-odyssey-hd.gianlucarollback.chatgpt.site).

## Destinazioni

| Destinazione | Uso |
| --- | --- |
| `E:/Repos/max/corporate-odyssey` | Sorgenti, asset, test e documentazione del gioco |
| Remoto `max-hd`: `maxdbt/corporate-odissey-hd` | Consegna GitHub autorizzata su main |
| `E:/Repos/max/sites/corporate-odyssey-hd` | Repository tecnico separato di pubblicazione |
| Progetto Sites `appgprj_6afa07a7ef148191904ec2ac8fe87154` | Sito esistente; preservare identità e accesso pubblico |

Il vincolo iniziale del 15 novembre consentiva soltanto commit locali e push tecnico Sites. Le richieste successive «quando finisci fai push» e «pubblica anche il sito aggiornato» autorizzano ora la consegna sul remoto `max-hd` e il deployment Sites. Non usare il remoto `origin` del repository iniziale per questa consegna.

## Procedura

1. Completare e verificare il gioco: `node --test tests/*.test.js`, `npm run build`, collaudo browser.
2. Commit dei sorgenti, asset e documentazione; push sul remoto di consegna.
3. Copiare esattamente la build `dist` nel repository Sites, preservando `.openai/hosting.json` con `static.directory: "dist"`.
4. Usare il workflow Sites per commit/push tecnico, archivio, salvataggio della versione e deployment sullo stesso progetto.
5. Confermare lo stato terminale riuscito del deployment e riportare l'URL restituito.

Le credenziali temporanee passano soltanto in memoria e tramite stdin al workflow, mai in file, log o argomenti della shell. Il sito riceve esclusivamente il contenuto statico del gioco e la configurazione di hosting.

## Caricamenti grandi

Il repository Sites applica un limite di 64 MiB per singolo push. Se i nuovi PNG lo superano, suddividere l'invio dei sorgenti in commit tecnici sequenziali sotto soglia. Non usare force push. Salvare e pubblicare soltanto il commit finale completo: i commit intermedi non devono diventare una versione giocabile incompleta.

La campagna precedente ha già richiesto due invii tecnici. Il repository del sito conserva separatamente la provenienza della build nel suo README.

## PWA e verifica

Il banner «NUOVA VERSIONE - AGGIORNA» consente di passare alla build nuova senza interrompere automaticamente una partita in corso. Il caricamento dei mondi è progressivo. Dettagli e limiti delle verifiche sono in [ANIMAZIONI_HD.md](ANIMAZIONI_HD.md) e [PORTING_CAMPAGNA_HD.md](PORTING_CAMPAGNA_HD.md).

Il risultato del deployment Sites è la fonte per attestare quale versione è effettivamente online; un commit o un archivio locale, da soli, non attestano la pubblicazione.
## Versione pubblicata il 23 novembre 2026

- Versione Sites: **2**, deployment concluso con stato `succeeded`.
- Sorgenti del gioco: `f8251357f6695a8c266ca9e02fcfff2e9a44358f`, pubblicati su `max-hd/main`.
- Commit tecnico Sites: `306ecf67c4df06b0c4a78cbfb9bcddcc3f0ff1f6`.
- Contenuto: campagna HD completa, animazioni 16/12/24 frame, mostro del bagno e composizioni integrate di mezzi e personaggi.
- Verifiche: 25 test superati, build di produzione riuscita, 171 file della copia di pubblicazione confrontati tramite hash con la build verificata; prove browser desktop e viewport mobile descritte in [ANIMAZIONI_HD.md](ANIMAZIONI_HD.md).
- URL: [prova Corporate Odyssey HD](https://corporate-odyssey-hd.gianlucarollback.chatgpt.site).

Il rilascio è stato isolato dalle modifiche ad audio e minigolf ancora in lavorazione nella cartella principale. I PNG sono stati inviati in tre commit tecnici sotto il limite per push; è stata salvata e pubblicata solo la versione completa.
