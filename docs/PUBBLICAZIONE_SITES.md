# Pubblicazione su ChatGPT Sites

Destinazione configurata: [Corporate Odyssey HD](https://corporate-odyssey-hd.gianlucarollback.chatgpt.site). L'effettiva pubblicazione va confermata dal risultato del deployment Sites.

- Progetto Sites: `appgprj_6afa07a7ef148191904ec2ac8fe87154`.
- Cartella di pubblicazione separata: `E:/Repos/max/sites/corporate-odyssey-hd`.
- Output statico: `dist`, copia della build del gioco, senza documentazione, cronologia o credenziali del repository originale.
- Identità del sito: `.openai/hosting.json` nella cartella di pubblicazione.
- Il repository originale `maxdbt/corporate-odyssey` resta locale: **nessun push su GitHub**.

Il 15 novembre 2026 l'utente ha autorizzato esclusivamente il push tecnico al repository separato di ChatGPT Sites e il commit locale del progetto. Questa eccezione non autorizza push verso GitHub.

Per aggiornare il sito: costruire e verificare il gioco nel repository originale, aggiornare la copia statica e usare il workflow Sites per salvare la versione e pubblicarla sullo stesso progetto. Non creare un nuovo sito e non modificare il remote GitHub. Le credenziali temporanee Sites devono passare solo in memoria e tramite stdin al relativo helper.
