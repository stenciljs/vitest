import { Component, Host } from '@stencil/core';

@Component({
  tag: 'moo-poo',
  styleUrl: 'moo-poo.css',
  encapsulation: { type: 'shadow' },
})
export class MooPoo {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
