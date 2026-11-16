import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';

/** The body of a resizable dialog: it fills the body of the window (`fill: true`) and says how big it is, while the window is resized. */
@Component({
  selector: 'app-size-dialog',
  template: `
    <p>Drag an edge or the corner of the window. The component fills the body and follows it:</p>
    <p class="size">{{ size() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      box-sizing: border-box;
      border: 1px dashed var(--grd-border-color);
      border-radius: 4px;
      padding: 12px;
    }
    p {
      margin: 0 0 8px;
      text-align: center;
      line-height: 1.45;
    }
    .size {
      font-size: 1.6rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class SizeDialog {
  protected readonly size = signal('');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observer = new ResizeObserver(() => {
      this.size.set(`${Math.round(host.clientWidth)} × ${Math.round(host.clientHeight)} px`);
    });
    afterNextRender(() => observer.observe(host));
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
