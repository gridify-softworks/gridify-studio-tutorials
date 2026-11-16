// The icons of the commands: SVG texts, registered under names of their own in app.config.ts. A
// 16 x 16 viewBox and an outline in currentColor, as the icons of the library have them, so they
// take the color that the menu bar or the toolbar gives them.

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

export const APP_ICONS: Record<string, string> = {
  'app:save': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M2.75 2.75h8.5l2 2v8.5h-10.5z"/>
    <path ${LINE} d="M5.25 2.75v3h5v-3M5 13.25V9.5h6v3.75"/>
  </svg>`,
  'app:import': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M8 2.25v7.5M5 6.75l3 3 3-3"/>
    <path ${LINE} d="M2.25 9.75v3a1 1 0 0 0 1 1h9.5a1 1 0 0 0 1-1v-3"/>
  </svg>`,
  'app:print': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M4.25 6V2.25h7.5V6"/>
    <path ${LINE} d="M4.25 11.75h-1.5a.75.75 0 0 1-.75-.75V6.75A.75.75 0 0 1 2.75 6h10.5a.75.75 0 0 1 .75.75V11a.75.75 0 0 1-.75.75h-1.5"/>
    <path ${LINE} d="M4.25 9.25h7.5v4.5h-7.5z"/>
  </svg>`,
  'app:send': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M14 2 7.25 8.75"/>
    <path ${LINE} d="M14 2 9.75 14l-2.5-5.25L2 6.25z"/>
  </svg>`,
  'app:link': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2.1-2.1a2.75 2.75 0 0 0-3.9-3.9l-.85.85"/>
    <path ${LINE} d="M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2.1 2.1a2.75 2.75 0 0 0 3.9 3.9l.85-.85"/>
  </svg>`,
  'app:inbox': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M2.25 8.75 4 3.25h8l1.75 5.5v4h-11.5z"/>
    <path ${LINE} d="M2.25 8.75h3.5l.75 1.5h3l.75-1.5h3.5"/>
  </svg>`,
};
