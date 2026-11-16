// The icons of the buttons that the library does not have: SVG texts in a 16 x 16 viewBox, drawn in currentColor
// (so they take the color of the button), registered under names of their own in app.config.ts.

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

const icon = (paths: string) => `<svg viewBox="0 0 16 16" aria-hidden="true">${paths}</svg>`;

export const APP_ICONS: Record<string, string> = {
  'app:save': icon(
    `<path ${LINE} d="M3 2.75h7.75l2.25 2.25v8.25H3z"/><path ${LINE} d="M5.5 2.75v3h4.5v-3M5.25 13.25v-4h5.5v4"/>`,
  ),
  'app:trash': icon(
    `<path ${LINE} d="M2.75 4.25h10.5M6.25 4.25v-1.5h3.5v1.5M4.25 4.25l.75 9h6l.75-9M6.75 6.75v4M9.25 6.75v4"/>`,
  ),
  'app:upload': icon(`<path ${LINE} d="M8 10.25v-7.5M5 5.75l3-3 3 3M2.75 10.5v2.75h10.5V10.5"/>`),
  'app:bold': icon(
    `<path ${LINE} d="M4.5 2.75h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.75h4.75a2.75 2.75 0 0 1 0 5.5H4.5z"/>`,
  ),
  'app:italic': icon(`<path ${LINE} d="M7 2.75h5M4 13.25h5M10 2.75 6.5 13.25"/>`),
  'app:align-left': icon(`<path ${LINE} d="M2.75 4h10.5M2.75 7h7M2.75 10h10.5M2.75 13h7"/>`),
  'app:align-center': icon(`<path ${LINE} d="M2.75 4h10.5M4.5 7h7M2.75 10h10.5M4.5 13h7"/>`),
  'app:align-right': icon(`<path ${LINE} d="M2.75 4h10.5M6.25 7h7M2.75 10h10.5M6.25 13h7"/>`),
};
