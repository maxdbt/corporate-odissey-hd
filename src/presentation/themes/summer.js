import { officeTheme } from './office.js';

export const summerTheme = {
  ...officeTheme,
  id: 'summer-hd',
  background: 'hd-summer-office',
  // [atlas frame, logical height, optional atlas]. Shared objects keep one source.
  props: {
    ...officeTheme.props,
    door_exit: ['exitDoor', 81, 'hd-summer-props'],
    plane_ticket: ['planeTicket', 18, 'hd-summer-props'],
    mail: ['mail', 14, 'hd-summer-props'],
    p_email: ['urgentMail', 13, 'hd-summer-props'],
    water: ['cooler', 20]
  }
};
