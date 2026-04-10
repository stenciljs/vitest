import { Component, Prop, h } from '@stencil/core';
import { capitalize } from '../../utils/index.js';

/**
 * A label component that formats its value using the capitalize utility.
 * Used to demonstrate vi.mock() working with the stencilVitestPlugin.
 */
@Component({
  tag: 'my-label',
  shadow: true,
})
export class MyLabel {
  /** Raw text to display — run through `capitalize()` before rendering */
  @Prop() value: string = '';

  render() {
    return <span class="label">{capitalize(this.value)}</span>;
  }
}
