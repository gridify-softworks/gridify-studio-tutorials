import { Component, inject, input, OnInit, signal } from '@angular/core';
import { readFile } from './files-server';
import { Files } from './files';

/** A document: the content of one file. */
@Component({
  selector: 'app-file-view',
  template: `
    <p class="name">{{ files.nameOf(id()) }}</p>
    @if (text() === null) {
      <p>Loading…</p>
    } @else {
      <pre>{{ text() }}</pre>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    .name {
      margin: 0;
      opacity: 0.88;
    }
    pre {
      font-family: var(--grd-font-mono, monospace);
      white-space: pre-wrap;
    }
  `,
})
export class FileView implements OnInit {
  /** The id of the file: the input that Files.openFile gives the tab. */
  readonly id = input.required<string>();

  protected readonly files = inject(Files);
  /** The content, `null` while it is loaded. */
  protected readonly text = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.text.set(await readFile(this.id()));
  }
}
