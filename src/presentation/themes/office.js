// Skin catalog: reusable objects are independent of both level coordinates and enemy behavior.
export const officeTheme = {
  id: 'office-hd',
  font: 'Segoe UI, Arial, sans-serif',
  props: {
    plant: ['plant', 48], xmas_tree: ['tree', 92], water_cooler: ['cooler', 49],
    door_exit: ['exitDoor', 75], party_door: ['partyDoor', 90],
    laptop: ['laptop', 23], smartphone: ['laptop', 18],
    euro1: ['euro', 11], euro2: ['euro', 11], ticket: ['ticket', 12],
    coffee: ['coffee', 18], vacation: ['vacation', 24],
    promotion: ['promotion', 28], raise: ['euro', 24], car: ['vacation', 24], p_coffee: ['coffee', 12]
  },
  enemies: {
    talker1: ['talker1', 40], talker2: ['talker2', 40],
    party1: ['party1', 48], party2: ['party2', 48],
    clienthell: ['clienthell', 35, { referenceScaleY: 1 }], bug1: ['bug', 18], bug2: ['bug', 18],
    confcall1: ['confcall', 23], confcall2: ['confcall', 23],
    minute1: ['minute', 29], minute2: ['minute', 29], teams_icon: ['teamsicon', 23],
    elf_bouncer: ['talker1', 43],
    p_paper: ['paper', 13], paper: ['paper', 13], folder: ['paper', 16],
    panettone: ['panettone', 15], flame: ['flame', 17], p_flame: ['flame', 17],
    p_email: ['paper', 12], p_teams: ['teamsicon', 14], p_clock: ['minute', 16],
    mail: ['paper', 14]
  }
};
