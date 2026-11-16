import { GrdDockContainerNodeInput } from '@gridify/studio';

/**
 * The first document: what this tutorial is about and what to try, so it is on the screen as soon
 * as the tutorial starts.
 */
const WELCOME = `
<h2>Maximize a panel</h2>
<p>
  A document you work in for long can have the whole area of the panels: the panel fills the
  dockable core, and the other panels wait behind it with their tabs as they are. The library
  lets the documents do it (the setting <code>maximize</code> is <code>'documents'</code>); View ›
  Panels that can be maximized switches it (<code>setMaximize</code>).
</p>
<h3>There and back</h3>
<ul>
  <li><strong>Double-click</strong> this tab, or the empty room of the strip beside the tabs.</li>
  <li>The <strong>button</strong> at the right end of the header of this panel.</li>
  <li>
    <strong>Ctrl+M</strong> on a tab that has the focus, and <strong>Esc</strong> to come back.
  </li>
  <li>
    <strong>Maximize</strong> and <strong>Restore</strong> in the menu of a tab (the right mouse
    button).
  </li>
  <li>View › Maximize the document in the menu bar (the application calls the API).</li>
</ul>
<h3>Back by itself</h3>
<ul>
  <li>
    Drag a tab of the maximized panel: the panels come back, so there is a place to drop it on.
  </li>
  <li>View › Show the properties: a tab of another panel has to be seen.</li>
  <li>View › Reset layout: another layout comes.</li>
</ul>
<h3>Tabs that say otherwise</h3>
<ul>
  <li>
    <strong>Output</strong> (a tool, at the bottom) says <code>maximizable: true</code>: it can be
    maximized too.
  </li>
  <li>
    <strong>Pinned notes</strong> (a document) says <code>maximizable: false</code>: while it is
    the active tab, its panel cannot.
  </li>
</ul>
<p>Nothing of it is saved: press F5 while a panel is maximized, and the layout comes as it was.</p>
`;

const REPORT = `
<h2>report.md</h2>
<p>A long document to work in. Maximize it, scroll it, and restore it: the other panels come back
as they were, and so does the place this text is scrolled to.</p>
${Array.from({ length: 30 }, (_, i) => `<p>Paragraph ${i + 1} of the report.</p>`).join('')}
`;

/**
 * Files on the left, the documents in the middle, the properties on the right and the output at
 * the bottom, as in an IDE.
 */
export const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    {
      type: 'row',
      size: 75,
      children: [
        {
          tag: 'left',
          type: 'panel',
          role: 'tool',
          size: 20,
          activeTab: 0,
          collapsed: false,
          tabs: [
            {
              tag: 'files',
              role: 'tool',
              title: 'Files',
              content: '<ul><li>welcome.md</li><li>report.md</li><li>notes.md</li></ul>',
            },
          ],
        },
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 60,
          activeTab: 0,
          collapsed: false,
          tabs: [
            { tag: 'welcome', role: 'document', title: 'Welcome', content: WELCOME },
            { tag: 'report', role: 'document', title: 'report.md', content: REPORT },
            {
              tag: 'notes',
              role: 'document',
              title: 'Pinned notes',
              content: '<p>This document says maximizable: false.</p>',
              // While this tab is the active one, its panel cannot be maximized.
              maximizable: false,
            },
          ],
        },
        {
          tag: 'right',
          type: 'panel',
          role: 'tool',
          size: 20,
          activeTab: 0,
          collapsed: false,
          tabs: [
            {
              tag: 'properties',
              role: 'tool',
              title: 'Properties',
              content: '<p>Size: 4 kB</p><p>Changed: today</p>',
            },
          ],
        },
      ],
    },
    {
      tag: 'bottom',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          tag: 'output',
          role: 'tool',
          title: 'Output',
          content: '<pre>Build started…\nBuild finished: 0 errors, 2 warnings.</pre>',
          // A tool that can be maximized although the setting is only for documents.
          maximizable: true,
        },
      ],
    },
  ],
};
