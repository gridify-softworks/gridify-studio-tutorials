import { Component } from '@angular/core';

/** The document of the key `welcome`. */
@Component({
  selector: 'app-welcome',
  template: `
    <h2>A layout from a file</h2>
    <p>
      The panels around this tab are not written in the code: they are the file
      <code>src/app/layout.json</code>, which the Layout editor made. <code>loadLayout()</code> in
      <code>layout-loader.ts</code> (the Loader output of the editor) reads it with
      <code>grdLoadLayout</code>, which gives the tabs the classes of the components they name, and
      gives the layout to <code>[defaultLayout]</code>.
    </p>
    <p>
      This tab is the component of the key <code>welcome</code>. The tab <b>Notes</b> beside it is
      HTML that the file holds.
    </p>
    <p>
      Use <b>Layout</b> in the menu to replace the layout by the file
      <code>public/layouts/compact.json</code>, which the application fetches while it runs, or to
      try <code>public/layouts/foreign.json</code>, which names a component this application does
      not have.
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 16px;
      color: var(--grd-text-main);
      line-height: 1.5;
    }
    h2 {
      margin-top: 0;
    }
  `,
})
export class WelcomeComponent {}
