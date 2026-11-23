# Stato della campagna HD

Aggiornato il **23 novembre 2026**: implementati i 19 stage HD, le scene della trasferta e il finale, con un bonus per stage. L'aggiornamento grafico aggiunge cicli più ricchi per protagonisti, creature, boss, passeggeri e commensali, il mostro del bagno illustrato e composizioni animate dei personaggi a bordo dei mezzi.

- [Campagna e matrice livelli](PORTING_CAMPAGNA_HD.md).
- [Animazioni, boss e mezzi](ANIMAZIONI_HD.md).
- [Audio e jingle](AUDIO.md): integrati nell’avvio normale del gioco e nella build locale, con 19 temi distinti, varianti per boss e bonus, 45 effetti, pause condivise e limiti alle ripetizioni. Anche i bonus aperti direttamente sbloccano l’audio al primo comando. Anteprima WAV e pagina d’ascolto disponibili; questa revisione audio non è stata pubblicata con il rilascio delle animazioni.
- [Regole dei bonus](BONUS_PER_LIVELLO.md).
- [Pubblicazione e link](PUBBLICAZIONE_SITES.md).

Collaudo dell’integrazione audio del 23 novembre 2026: **47 test superati**, di cui **13 audio**, e build completata. Verificati nel browser avvio diretto del bonus telefonico, suono del mostro, pausa del bagno e tema del menu. Dettagli e limiti sono nel [resoconto audio](AUDIO.md#esito-del-collaudo-del-23-novembre-2026); la prova su telefono fisico resta da eseguire.

L'utente ha autorizzato commit e push su `max-hd/main` (`maxdbt/corporate-odissey-hd`) e l'aggiornamento del sito esistente. Questa richiesta successiva sostituisce il precedente vincolo di lavoro soltanto locale. GitHub e Sites hanno repository distinti; un push GitHub non pubblica automaticamente Sites.
