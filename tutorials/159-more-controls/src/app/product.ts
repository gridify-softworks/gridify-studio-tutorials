import { Injectable, signal } from '@angular/core';
import type { GrdOption, GrdPictureGalleryItem } from '@gridify/studio';

/** The sizes of a bag, in the order the form shows them. */
export const SIZES = ['250 g', '500 g', '1 kg'];

/** The shops: the options of the transfer list (the value is kept, the label is shown). */
export const SHOPS: GrdOption<string>[] = [
  { value: 'old-town', label: 'Old Town' },
  { value: 'riverside', label: 'Riverside' },
  { value: 'station', label: 'Main Station' },
  { value: 'airport', label: 'Airport' },
  { value: 'vinohrady', label: 'Vinohrady' },
  { value: 'online', label: 'Online shop' },
];

/** The pictures of the product, from the folder public/pictures. */
export const PICTURES: GrdPictureGalleryItem[] = [
  { src: 'pictures/bag.svg', title: 'The bag', caption: 'Ethiopia Yirgacheffe, light roast' },
  { src: 'pictures/beans.svg', title: 'The beans', caption: 'Roasted every Monday' },
  { src: 'pictures/cup.svg', title: 'In the cup', caption: 'Notes of jasmine and lemon' },
];

/** The product that the form changes and the preview shows: a signal for each field. */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  readonly name = signal('Ethiopia Yirgacheffe');
  readonly tags = signal<readonly string[]>(['single origin', 'light roast']);
  readonly sizes = signal<readonly string[]>(['250 g']);
  readonly color = signal('#c2410c');
  readonly shops = signal<readonly string[]>(['old-town', 'online']);
}
