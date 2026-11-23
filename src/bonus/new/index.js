import PartyEscape from './PartyEscape.js';
import ParkingPuzzle from './ParkingPuzzle.js';
import PedaloEscape from './PedaloEscape.js';
import TrayRun from './TrayRun.js';
import MeetingCards from './MeetingCards.js';
import TaxiDrive from './TaxiDrive.js';
import PackingPuzzle from './PackingPuzzle.js';
export const ROUND_TYPES={party:PartyEscape,parking:ParkingPuzzle,pedalo:PedaloEscape,tray:TrayRun,call:MeetingCards,taxi:TaxiDrive,packing:PackingPuzzle};
export const createBonusRound=id=>ROUND_TYPES[id]?new ROUND_TYPES[id]():null;
