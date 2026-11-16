// The icons of the commands: SVG texts, registered under names of their own in app.config.ts. A 16 x 16 viewBox and an outline in currentColor, as the icons
// of the library have them, so they take the color that the menu, the toolbar or the status bar gives them.

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

export const APP_ICONS: Record<string, string> = {
  'app:new': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M9.25 1.75H4.25a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5.25z"/>
    <path ${LINE} d="M9.25 1.75v3.5h3.5M8 7.5v4.5M5.75 9.75h4.5"/>
  </svg>`,
  'app:note': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M3.25 2.25h9.5v11.5h-9.5z"/>
    <path ${LINE} d="M5.5 5.25h5M5.5 8h5M5.5 10.75h3"/>
  </svg>`,
  'app:save': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M2.75 2.75h8.5l2 2v8.5h-10.5z"/>
    <path ${LINE} d="M5.25 2.75v3h5v-3M5 13.25V9.5h6v3.75"/>
  </svg>`,
  'app:close-doc': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M9.25 1.75H4.25a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5.25z"/>
    <path ${LINE} d="M6.25 8.25l3.5 3.5M9.75 8.25l-3.5 3.5"/>
  </svg>`,
  'app:wrap': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M2.25 3.75h11.5M2.25 8h9.25a2.25 2.25 0 0 1 0 4.5H8.25M2.25 12.25h3.5"/>
    <path ${LINE} d="M9.75 10.75 8 12.5l1.75 1.75"/>
  </svg>`,
  'app:case': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M1.75 12.25 4.75 3.75l3 8.5M2.85 9.25h3.8"/>
    <circle ${LINE} cx="11.75" cy="10" r="2.25"/>
    <path ${LINE} d="M14 7.75v4.5"/>
  </svg>`,
  'app:date': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M2.75 3.75h10.5v9.5H2.75zM2.75 6.75h10.5M5.5 2.25v2.5M10.5 2.25v2.5"/>
    <path ${LINE} d="M8 8.75v2.5M6.75 10h2.5"/>
  </svg>`,
};
