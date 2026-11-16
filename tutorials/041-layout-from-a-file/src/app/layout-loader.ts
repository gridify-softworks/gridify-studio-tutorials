// Made by the Layout editor: Output › Loader (formatted like the tutorials); only this line was added.
import { inject } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdEngineSettings,
  grdLoadLayout,
} from '@gridify/studio';
import { ExplorerComponent } from './explorer.component';
import { WelcomeComponent } from './welcome.component';
import { OutputComponent } from './output.component';
// the file is imported as JSON ("resolveJsonModule": true in tsconfig.json)
import file from './layout.json';

/** The layout of the file for [defaultLayout]. It calls inject(), so call it in a component: readonly layout = loadLayout(); */
export function loadLayout(): GrdDockContainerNodeInput {
  const registry = inject(GrdContentRegistry);
  // a tab finds its component by the "componentKey": the loader gives it the class, and registers every component of the file
  const loaded = grdLoadLayout(file, {
    components: { explorer: ExplorerComponent, welcome: WelcomeComponent, output: OutputComponent },
    registry,
  });
  // the docking mode the layout is made for
  inject(GrdEngineSettings).setDockingMode(loaded.dockingMode);
  return loaded.layout;
}
