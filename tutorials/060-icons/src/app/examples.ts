import { GRD_ICON, grdClassIcon } from '@gridify/studio';
import type { GrdButtonAppearance, GrdButtonLayout, GrdButtonVariant } from '@gridify/studio';

// The buttons of the page, section by section. Every button is an example: its icon, and what its toast says about the icon.

/** A button of the page, and what its toast says: how its icon is defined, and the line of a template. */
export interface Example {
  label: string;
  icon: string;
  how: string;
  code: string;
  variant?: GrdButtonVariant;
  appearance?: GrdButtonAppearance;
  layout?: GrdButtonLayout;
  iconOnly?: boolean;
  /** A class of the button (its own icon color, see the styles). */
  cls?: string;
}

/** A row of buttons; `cls` gives the row its size (see the styles). */
export interface Row {
  name?: string;
  cls?: string;
  examples: Example[];
}

export interface Section {
  id: string;
  title: string;
  text: string;
  rows: Row[];
}

// One function for each kind of icon: it makes an example, the icon and what the toast says about it.

/** A library icon: a name of the registry (`grd:…`), registered when the library loads. */
const library = (label: string, name: string): Example => ({
  label,
  icon: name,
  how: `'${name}' is an icon of the library. It is in the registry from the start: nothing to register.`,
  code: `<grd-button label="${label}" icon="${name}" />`,
});

/** An icon of the application: an SVG of app-icons.ts, registered in app.config.ts. */
const app = (label: string, name: string): Example => ({
  label,
  icon: name,
  how: `'${name}' is an SVG of the application (app-icons.ts), registered under that name in app.config.ts: inject(GrdIcons).setMany(APP_ICONS).`,
  code: `<grd-button label="${label}" icon="${name}" />`,
});

/** Text: a value that is no name of the registry is written as it is. */
const text = (label: string, value: string): Example => ({
  label,
  icon: value,
  how: `'${value}' is no name of the registry, so it is written as text. An emoji keeps its own colors, a plain character takes the color of the text.`,
  code: `<grd-button label="${label}" icon="${value}" />`,
});

/** A font icon: `grdClassIcon` makes an <i> with the classes, the CSS of the font draws it. */
const prime = (label: string, classes: string): Example => ({
  label,
  icon: grdClassIcon(classes),
  how: `grdClassIcon('${classes}') draws <i class="${classes}">. The glyph comes from PrimeIcons: primeicons.css in angular.json.`,
  code: `<grd-button label="${label}" [icon]="grdClassIcon('${classes}')" />`,
});

/** The same example with something more: a size, a color, a look. */
const more = (example: Example, how: string, changes: Partial<Example> = {}): Example => ({
  ...example,
  ...changes,
  how: `${example.how} ${how}`,
});

/** The three kinds of icon in every row of sizes: they all grow with the button. */
const SIZE_SET = [
  library('Document', GRD_ICON.document),
  app('Rocket', 'app:rocket'),
  prime('Heart', 'pi pi-heart'),
];

/** The Rocket with its icon only: the label is then its tooltip and its accessible name. */
const rocketOnly = (name: string): Example => ({
  ...SIZE_SET[1],
  label: `Rocket (${name})`,
  iconOnly: true,
  code: `<grd-button label="Rocket (${name})" icon="app:rocket" iconOnly />`,
});

/**
 * A row of sizes: the same buttons in a row with a size of its own, and the Rocket with its icon only. The size is the class of the row (`cls`); its values are only in the styles of App, so the
 * toast names the class and does not repeat them.
 */
const sizeRow = (name: string, cls: string): Row => ({
  name,
  cls,
  examples: [...SIZE_SET, rocketOnly(name)].map((example) =>
    more(
      example,
      `The size comes from the row: <div class="${cls}">. The class .${cls} sets --grd-button-height and --grd-font-size in the styles of App.`,
      {
        code: `<div class="${cls}">\n  ${example.code}\n</div>`,
      },
    ),
  ),
});

export const SECTIONS: Section[] = [
  {
    id: 'library',
    title: '1. The icons of the library',
    text: 'Names that start with grd: are the icons of the library. They are registered when the library loads, so a component uses them by their name. GRD_ICON has the names.',
    rows: [
      {
        examples: [
          library('Logo', GRD_ICON.logo),
          library('Document', GRD_ICON.document),
          library('Tool', GRD_ICON.tool),
          library('Calendar', GRD_ICON.calendar),
          library('User', GRD_ICON.user),
          library('Lock', GRD_ICON.lock),
        ],
      },
    ],
  },
  {
    id: 'app',
    title: '2. Icons of the application',
    text: 'An SVG of your own, registered under a name of your own when the application starts (app.config.ts). From then on it is used by the name, like an icon of the library.',
    rows: [
      {
        examples: [
          app('Rocket', 'app:rocket'),
          app('Invoice', 'app:invoice'),
          app('Cloud', 'app:cloud'),
          app('Flag', 'app:flag'),
          more(app('Traffic light', 'app:traffic-light'), 'Its colors are written in the SVG.'),
        ],
      },
    ],
  },
  {
    id: 'file',
    title: '3. Your own icons: a file, and text',
    text: 'The star is the file public/icons/star.svg. Until it is loaded, a placeholder stands under its name (a dashed circle); "Load star.svg" fetches the file and registers it under the same name, and both star buttons change. A value that is no name of the registry is written as text: an emoji, or a character.',
    rows: [
      {
        examples: [
          {
            label: 'Star',
            icon: 'app:file-star',
            how: `'app:file-star' is the file public/icons/star.svg: fetched and registered with GrdIcons.set() when "Load star.svg" is pressed (App.loadStar). Before that, a placeholder of app-icons.ts stands under the name.`,
            code: `<grd-button label="Star" icon="app:file-star" />`,
          },
          {
            label: 'Star (icon only)',
            icon: 'app:file-star',
            iconOnly: true,
            how: `The same name, 'app:file-star': every element that shows a name is drawn again when the icon under the name changes.`,
            code: `<grd-button label="Star (icon only)" icon="app:file-star" iconOnly />`,
          },
        ],
      },
      {
        examples: [text('Emoji', '🚀'), text('Star', '★'), text('Euro', '€'), text('Omega', 'Ω')],
      },
    ],
  },
  {
    id: 'prime',
    title: '4. PrimeIcons and other icon fonts',
    text: 'An icon font draws its icons with classes: grdClassIcon(…) turns them into an icon value. The font is the primeicons package from npm; its stylesheet is in the styles of angular.json. Font Awesome, Bootstrap Icons and the others work the same way.',
    rows: [
      {
        examples: [
          prime('Heart', 'pi pi-heart'),
          prime('Star', 'pi pi-star-fill'),
          prime('Bell', 'pi pi-bell'),
          prime('Like', 'pi pi-thumbs-up'),
          prime('GitHub', 'pi pi-github'),
          more(prime('Settings', 'pi pi-cog pi-spin'), 'pi-spin is a class of PrimeIcons too.'),
        ],
      },
    ],
  },
  {
    id: 'size',
    title: '5. Size',
    text: 'A button has no size input: it is as high as a control of the density (the select in the header) and its icon is as big as its font. A container changes both with two CSS variables, for every button inside it, and every kind of icon grows with them.',
    rows: [
      sizeRow('Small', 'size-s'),
      {
        name: 'Default',
        examples: SIZE_SET.map((example) => more(example, 'The size of the density.')),
      },
      sizeRow('Large', 'size-l'),
      sizeRow('Very large', 'size-xl'),
      {
        name: 'Column',
        cls: 'size-l',
        examples: SIZE_SET.map((example) =>
          more(example, 'layout="column" puts the icon above the text.', {
            layout: 'column',
            code: example.code.replace('<grd-button ', '<grd-button layout="column" '),
          }),
        ),
      },
    ],
  },
  {
    id: 'color',
    title: '6. Color',
    text: 'An icon has the color of the text of its button: it follows the theme, the variant and the hover. --grd-button-icon-color gives the icon a color of its own. An SVG with its own colors, and an emoji, keep theirs.',
    rows: [
      {
        name: 'Variant',
        examples: [
          more(
            library('Save', GRD_ICON.check),
            'variant="primary": the icon is as white as the text.',
            {
              variant: 'primary',
              code: `<grd-button label="Save" icon="grd:check" variant="primary" />`,
            },
          ),
          more(prime('Done', 'pi pi-check'), 'variant="success".', {
            variant: 'success',
            code: `<grd-button label="Done" [icon]="grdClassIcon('pi pi-check')" variant="success" />`,
          }),
          more(prime('Delete', 'pi pi-trash'), 'variant="danger".', {
            variant: 'danger',
            code: `<grd-button label="Delete" [icon]="grdClassIcon('pi pi-trash')" variant="danger" />`,
          }),
        ],
      },
      {
        name: 'Own color',
        examples: [
          more(
            prime('Start', 'pi pi-play'),
            'The class go sets --grd-button-icon-color: var(--grd-success-text).',
            {
              cls: 'go',
              appearance: 'flat',
              code: `<grd-button class="go" label="Start" [icon]="grdClassIcon('pi pi-play')" appearance="flat" />`,
            },
          ),
          more(
            prime('Stop', 'pi pi-stop'),
            'The class stop sets --grd-button-icon-color: var(--grd-danger-text).',
            {
              cls: 'stop',
              appearance: 'flat',
              code: `<grd-button class="stop" label="Stop" [icon]="grdClassIcon('pi pi-stop')" appearance="flat" />`,
            },
          ),
          more(
            app('Launch', 'app:rocket'),
            'The class accent sets --grd-button-icon-color: var(--grd-accent).',
            {
              cls: 'accent',
              appearance: 'flat',
              code: `<grd-button class="accent" label="Launch" icon="app:rocket" appearance="flat" />`,
            },
          ),
        ],
      },
      {
        name: 'Own colors',
        examples: [
          more(
            app('Traffic light', 'app:traffic-light'),
            'Its colors are written in the SVG, so the text color does not change them.',
            {
              variant: 'primary',
              code: `<grd-button label="Traffic light" icon="app:traffic-light" variant="primary" />`,
            },
          ),
          more(text('Emoji', '🚀'), 'variant="primary" changes the text, not the emoji.', {
            variant: 'primary',
            code: `<grd-button label="Emoji" icon="🚀" variant="primary" />`,
          }),
        ],
      },
    ],
  },
];
