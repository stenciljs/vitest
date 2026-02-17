import { Component, h } from '@stencil/core';

/**
 * Test component with scoped encapsulation (non-shadow) and slots
 * Stencil polyfills slot behavior and protects the component by monkey-patching
 * childNodes, children, firstChild, lastChild to only return lightDOM
 * Original accessors are moved to __childNodes, __children, etc.
 */
@Component({
  tag: 'non-shadow-component',
  scoped: true,
})
export class NonShadowComponent {
  render() {
    return (
      <div class="wrapper">
        <div class="header">
          <slot name="header">Default Header</slot>
        </div>
        <div class="content">
          <img src="https://via.placeholder.com/150" alt="Placeholder Image" />
          <slot>Default Content</slot>
        </div>
        <div class="footer">
          <slot name="footer">Default Footer</slot>
        </div>
      </div>
    );
  }
}
