# 060 – Icons

This tutorial shows how to use icons from every source the library knows, and how to size and color them. You will learn how to:

- use the icons of the library, and register icons of the application when it starts;
- load an SVG file while the application runs;
- use plain text and emoji as icons, and an icon font from npm (PrimeIcons);
- give an icon a size and a color, and put it on its own into a line of text.

A click on a button shows a toast with the icon, how the icon is defined, and the line of the template under **Details**. There is no docking engine: a header and a page. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 060
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30060, click a few buttons and open **Details** in a toast. Press **Load star.svg** and watch both star buttons change. Switch the theme and the density in the header.

## The code

`src/app/app-icons.ts` holds the SVG texts of the application (the start of it):

```ts
const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

export const APP_ICONS: Record<string, string> = {
  'app:rocket': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path ${LINE} d="M8 1.75c2.4 1.7 3.5 4.3 3.25 7.5L8 12.25 4.75 9.25C4.5 6.05 5.6 3.45 8 1.75z"/>
    …
  </svg>`,
  'app:invoice': `…`,
  'app:cloud': `…`,
  'app:flag': `…`,
  // Three colors of its own: currentColor does not reach it.
  'app:traffic-light': `<svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4.75" y="1" width="6.5" height="14" rx="2" fill="#374151"/>
    <circle cx="8" cy="4.25" r="1.6" fill="#ef4444"/>
    …
  </svg>`,
  // Stands in for public/icons/star.svg until the file is loaded (see App.loadStar): a dashed circle.
  'app:file-star': PLACEHOLDER,
};
```

`src/app/app.config.ts` registers them:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The icons of the application are in the registry before the first component is drawn.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
```

`src/app/examples.ts` describes the buttons, section by section. Every button is an `Example`: a label, an icon, and the two texts of its toast. One function for each kind of icon makes them:

```ts
const library = (label: string, name: string): Example => ({
  label,
  icon: name,
  how: `'${name}' is an icon of the library. It is in the registry from the start: nothing to register.`,
  code: `<grd-button label="${label}" icon="${name}" />`,
});

const app = (label: string, name: string): Example => ({ label, icon: name, … });
const text = (label: string, value: string): Example => ({ label, icon: value, … });

const prime = (label: string, classes: string): Example => ({
  label,
  icon: grdClassIcon(classes),
  how: `grdClassIcon('${classes}') draws <i class="${classes}">. The glyph comes from PrimeIcons: primeicons.css in angular.json.`,
  code: `<grd-button label="${label}" [icon]="grdClassIcon('${classes}')" />`,
});

export const SECTIONS: Section[] = [
  {
    id: 'library',
    title: '1. The icons of the library',
    text: '…',
    rows: [{ examples: [library('Logo', GRD_ICON.logo), library('Document', GRD_ICON.document), …] }],
  },
  { id: 'app', …, rows: [{ examples: [app('Rocket', 'app:rocket'), app('Invoice', 'app:invoice'), …] }] },
  …
];
```

`src/app/app.ts` draws them. Every button of the sections is the same line of the template:

<!-- prettier-ignore -->
```html
@for (example of row.examples; track example.label) {
  <grd-button
    [class]="example.cls ?? ''"
    [label]="example.label"
    [icon]="example.icon"
    [iconOnly]="!!example.iconOnly"
    [variant]="example.variant ?? 'default'"
    [appearance]="example.appearance ?? 'solid'"
    [layout]="example.layout ?? 'row'"
    (pressed)="show(example)"
  />
}
```

and the click shows the toast:

```ts
protected show(example: Example): void {
  this.toast.info(example.how, {
    title: example.label,
    icon: example.icon,
    detail: example.code,
  });
}
```

The star comes from a file:

```ts
protected async loadStar(): Promise<void> {
  this.loading.set(true);
  try {
    const response = await fetch('icons/star.svg');
    if (!response.ok) {
      throw new Error(`icons/star.svg: ${response.status} ${response.statusText}`);
    }
    // The registry takes a text that starts with <svg: an <?xml …?> line or a comment before it would be refused.
    const svg = (await response.text()).replace(/^[\s\S]*?(?=<svg)/i, '');
    // A server that answers every unknown address with the page of the application sends 200 and no SVG.
    if (!/^<svg[\s>]/i.test(svg)) throw new Error('icons/star.svg is not an SVG file');
    this.icons.set('app:file-star', svg);
    this.starLoaded.set(true);
    this.toast.success('The star is loaded: both star buttons show it now.', {
      icon: 'app:file-star',
    });
  } catch (error) {
    this.toast.error(error);
  } finally {
    this.loading.set(false);
  }
}
```

and the last section puts icons into a line of text:

```html
<p class="inline">
  Saved <span class="icon ok" [grdIcon]="'grd:check'"></span>, look at this
  <span class="icon warn" [grdIcon]="'grd:alert'"></span>, a heart
  <span class="icon love" [grdIcon]="heart"></span>, a rocket
  <span class="icon" [grdIcon]="'app:rocket'"></span> and a bigger one
  <span class="icon big" [grdIcon]="'app:rocket'"></span>.
</p>
```

`angular.json` loads the stylesheet of PrimeIcons before the styles of the application:

```json
"styles": ["node_modules/primeicons/primeicons.css", "src/styles.scss"]
```

`src/styles.scss`:

```scss
@use '@gridify/studio/styles';

html,
body {
  height: 100%;
  margin: 0;
  font-family: var(--grd-font-main);
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}
```

## The sources of an icon

Everywhere the library takes an icon (`icon` of a button, a toast, a tab, a menu item, the directive `[grdIcon]`) the value is a string, and the library tells the kind by its shape:

- **a name of the registry** (`grd:document`, `app:rocket`): the SVG registered under that name is drawn;
- **a font icon** (`grdClassIcon('pi pi-heart')`, which is the text `cls:pi pi-heart`): an `<i class="pi pi-heart">` is drawn in the middle of the icon box, as big as the box, and the CSS of the font draws the glyph;
- **anything else** (`🚀`, `★`): it is written as text.

### 1. The icons of the library

The names that start with `grd:` are registered when the library loads, so nothing has to be done for them. `GRD_ICON` has the names of the common ones (`GRD_ICON.document` is `'grd:document'`): `close`, `check`, `alert`, `eye`, `eyeOff`, `capsLock`, `chevron`, `chevronUp`, `chevronDown`, `chevrons`, `plus`, `minus`, `calendar`, `clock`, `document`, `tool`, `component`, `logo`, `user`, `users`, `key`, `lock`, `logOut` and `zoom`. The components register a few more of their own (the docking engine has `GRD_ENGINE_ICON`). The Help playground of the repository shows them all.

### 2. Icons of the application

An icon of your own is an SVG text registered under a name of your own: `GrdIcons.set(name, svg)` for one, `setMany({…})` for several (the screen is drawn again once). Register them before anything shows them: `provideAppInitializer` in `app.config.ts` runs before the first component is created. From then on the name is used like a name of the library.

- **Draw them like the icons of the library:** a `viewBox` of 16 x 16, no `width` and `height` (the element around the icon gives the size), the lines in `currentColor` (the icon has the color of the text, in every theme), `aria-hidden="true"` (the meaning is in the label of the button).
- **A value that does not start with `<svg` is refused:** the icon is not registered and the console says why.
- **A name that is taken is replaced**, also a name of the library: `set('grd:check', …)` changes the check mark of every field of the application.
- **A prefix of your own** (`app:`) keeps your names apart from the ones of the library. The name is only a key: any text without spaces will do.

### 3. Your own icons: a file, and text

The star is `public/icons/star.svg`. `ng serve` and `ng build` serve the folder `public` at the root of the address, so the file is `icons/star.svg`. `App.loadStar` fetches it and registers the text under `app:file-star`. Until then a placeholder of `app-icons.ts` stands under that name: an element that shows a name is drawn again whenever the icon under the name changes, so both star buttons change when the file arrives, and again with **Placeholder again**. An icon that arrives late (from a server, with the data of a user) is just a later `set`.

A file exported from a drawing program often starts with `<?xml …?>` or a comment; the registry wants the text to start with `<svg`, so `loadStar` cuts off what stands before it. An SVG that is not yours is not checked by the library (icons are application code, they are not sanitized): load only files you trust.

Any other text is written as it is: an emoji, a symbol, a letter. An emoji has colors of its own; a character takes the color of the text. A text of two or more plain letters that is not a name (`app:rokcet`, a typo) is written too, so you see it at once, and in development the console warns about it once.

### 4. PrimeIcons and other icon fonts

An icon font draws its icons with classes: PrimeIcons with `pi pi-heart`, Font Awesome with `fa-solid fa-heart`, Bootstrap Icons with `bi bi-heart`. `grdClassIcon('pi pi-heart')` makes the classes an icon value, and the library draws `<i class="pi pi-heart" aria-hidden="true">`. The library does not know the font: the application installs it (`npm i primeicons`) and loads its stylesheet. Here it is the first entry of `styles` in `angular.json`, the place where Angular takes the stylesheets of packages: the build copies the font files that the stylesheet names into the output by itself.

`pi-spin` (the Settings button) is a class of PrimeIcons too: whatever the font offers works, because the classes are passed on as they are.

## Size and color

### Size

A button has no input for its size: it is as high as a control of the density (the select in the header) and writes in the font of the density. A container changes both for every button inside it with two CSS variables. The rows of the page have these classes (`<div class="row size-s">`), and the values are in the styles of `App`, nowhere else:

```css
.size-s {
  --grd-button-height: 24px;
  --grd-font-size: 11px;
}
.size-l {
  --grd-button-height: 36px;
  --grd-font-size: 15px;
}
.size-xl {
  --grd-button-height: 48px;
  --grd-font-size: 19px;
}
```

The icon of a button is a box of 1.15em of its font, so it grows with the font; with `layout="column"` the box is 1.9em and stands above the text (the **Column** row). An SVG fills the box by itself. A font icon and an emoji are characters: the library puts them in the middle of the box and gives them the size of the box, so they line up with the SVG icons in every size and in the column too.

`iconOnly` draws the icon alone, in a square button: the label is then its tooltip and its accessible name.

### Color

An icon has the color of the text of its element (`currentColor`): it follows the theme, the `variant` of the button (white in a primary button) and the hover. A button gives its icon a color of its own with `--grd-button-icon-color`:

```css
.go {
  --grd-button-icon-color: var(--grd-success-text);
}
```

The colors here are tokens of the themes (`--grd-success-text`, `--grd-danger-text`, `--grd-accent`), so they stay readable in a dark theme. An SVG with colors written into it (the traffic light) and an emoji keep their own colors whatever the text does.

### An icon on its own

`[grdIcon]` draws any icon value into an element of yours. The element gives the icon its size and its color:

```css
.icon {
  display: inline-flex;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}
/* The svg is not a part of this template: a style of the component reaches it only through ::ng-deep. */
.icon ::ng-deep svg {
  width: 100%;
  height: 100%;
}
.big {
  font-size: 32px;
}
```

1em is as high as the text around it; a bigger `font-size` makes a bigger icon. An SVG has no size of its own (a `viewBox` and nothing else): the rule for the `svg` makes it as big as its element, without it the browser would draw it at its own default size.

## What you get without writing any of it

- **Everything that shows a name is drawn again when the icon changes**: the buttons, the toasts and the icons on their own. Nothing has to be told to refresh.
- **The theme reaches every icon** that is drawn in `currentColor`: switch to a dark theme in the header and all of them turn light, the ones in a variant keep the color of their variant.
- **The density reaches the default buttons**: switch the density and the buttons of the Default row (and of every section without a size of its own) change their height, their font and their icon.
- **The toast** shows the icon of the button, closes itself after a few seconds, stays while the pointer is over it, and closes with its cross or with Esc. **Details** opens the line of the template, and the Copy button copies the title, the text and the details.
- **The buttons** take the keyboard (Tab, Enter, Space), and a disabled one is greyed out with its icon.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 060 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new icons --style=scss --ssr=false --skip-tests
   cd icons
   ```

   Accept the defaults for any other question.

2. Install the library and PrimeIcons. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz primeicons
   ```

3. In `angular.json`, put the stylesheet of PrimeIcons before your own one, and raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library):

   ```json
   "styles": ["node_modules/primeicons/primeicons.css", "src/styles.scss"]
   ```

4. Write `src/styles.scss` as above.

5. Add `src/app/app-icons.ts`, `src/app/examples.ts` and `public/icons/star.svg`, replace `src/app/app.ts` and `src/app/app.config.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
