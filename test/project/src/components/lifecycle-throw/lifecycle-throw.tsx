import { Component, Prop, h } from '@stencil/core';

/**
 * A component that throws in componentWillLoad when a required prop is missing.
 * Used to test that lifecycle hooks are called and errors propagate correctly.
 */
@Component({
  tag: 'lifecycle-throw',
  shadow: true,
})
export class LifecycleThrow {
  /**
   * Required label prop - throws if not provided
   */
  @Prop() label: string;

  componentWillLoad() {
    if (!this.label) {
      throw new Error('Property [label] required');
    }
  }

  render() {
    return <span>{this.label}</span>;
  }
}
