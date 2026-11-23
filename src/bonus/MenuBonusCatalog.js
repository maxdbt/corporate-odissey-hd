import { STAGE_BONUSES } from './StageBonusCatalog.js';

// The desk redesign returns as a free-play bonus. Campaign entrances stay explicit.
export const LAST_MAIL_BONUS = Object.freeze({
  id:'last-mail', stage:'1-1', title:'L’ultima mail', genre:'Ultimo minuto prima delle ferie',
  world:'office', atlas:'objects', frame:'phone', freePlayOnly:true,
  instructions:'Leggi 12 richieste e scegli CHIUDI ORA, A GENNAIO o CESTINO. Servono 9 scelte corrette, di cui 3 urgenze chiuse. Poi attiva la risposta automatica e spegni il PC entro 60 secondi. Mouse/tocco o trascinamento; tasti 1, 2, 3 per i timbri, Spazio per il caffè.'
});
export const MENU_BONUSES = Object.freeze([...STAGE_BONUSES,LAST_MAIL_BONUS]);
