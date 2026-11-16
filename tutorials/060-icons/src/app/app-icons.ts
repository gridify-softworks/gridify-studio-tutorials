// The icons of the application: SVG texts, registered under names of their own in app.config.ts.
//
// They are drawn the way the icons of the library are: a 16 x 16 viewBox, no width and height (the size comes from the element
// around the icon), an outline in currentColor (the icon has the color of the text, in every theme). The traffic light is the
// exception on purpose: its colors are written into it, so it keeps them everywhere.

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

/** The placeholder of an icon that comes from a file. */
export const PLACEHOLDER = `<svg viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
</svg>`;

export const APP_ICONS: Record<string, string> = {
  'app:rocket': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M8 1.75c2.4 1.7 3.5 4.3 3.25 7.5L8 12.25 4.75 9.25C4.5 6.05 5.6 3.45 8 1.75z"/>
    <circle ${LINE} cx="8" cy="6.25" r="1.25"/>
    <path ${LINE} d="M4.9 8.6 2.75 11v2.25l2.5-1.5M11.1 8.6l2.15 2.4v2.25l-2.5-1.5M7 13.75 8 15l1-1.25"/>
  </svg>`,
  'app:invoice': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M3.5 1.75h9v12.5l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z"/>
    <path ${LINE} d="M5.75 5h4.5M5.75 7.5h4.5M5.75 10h2.5"/>
  </svg>`,
  'app:cloud': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M4.75 12.75h6.75a3 3 0 0 0 .3-5.98 4 4 0 0 0-7.6 1.03 2.5 2.5 0 0 0 .55 4.95z"/>
  </svg>`,
  'app:flag': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M3.5 14.25V2.25M3.5 2.75h8.75l-2 3 2 3H3.5"/>
  </svg>`,
  // Three colors of its own: currentColor does not reach it.
  'app:traffic-light': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4.75" y="1" width="6.5" height="14" rx="2" fill="#374151"/>
    <circle cx="8" cy="4.25" r="1.6" fill="#ef4444"/>
    <circle cx="8" cy="8" r="1.6" fill="#f59e0b"/>
    <circle cx="8" cy="11.75" r="1.6" fill="#22c55e"/>
  </svg>`,
  // Stands in for public/icons/star.svg until the file is loaded (see App.loadStar): a dashed circle.
  'app:file-star': PLACEHOLDER,
};
