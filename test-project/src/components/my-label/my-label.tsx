import { Component, Prop, State, h } from '@stencil/core';
import { capitalize } from '../../utils/index.js';

/**
 * A label component that formats its value using the capitalize utility.
 * Used to demonstrate vi.mock() working with the stencilVitestPlugin.
 */
@Component({
  tag: 'my-label',
  shadow: true,
  styleUrl: 'my-label.css',
})
export class MyLabel {
  /** Raw text to display — run through `capitalize()` before rendering */
  @Prop() value: string = '';

  @State() state = {
    property: 'value',
  };

  componentDidLoad(): void {
    window.dispatchEvent(new Event('custom-event'));
  }

  render() {
    return (
      <span class="label">
        {capitalize(this.value)} state: {this.state.property}
      </span>
    );
  }
}
