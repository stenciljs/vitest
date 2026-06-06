import { Component, Prop, h } from '@stencil/core';
import { capitalize } from '../../utils/index.js';

/**
 * Base class providing shared formatting logic.
 * Must be co-located in the same file as the component when using
 * stencilVitestPlugin, because transpileSync is a single-file compiler
 * and cannot follow imports to resolve external base class metadata.
 */
class FormattedBase {
  /** Applies capitalize() from utils — mockable in tests */
  protected format(value: string): string {
    return capitalize(value);
  }
}

/**
 * A labelled badge that extends FormattedBase for its text formatting.
 * Demonstrates that vi.mock() intercepts imports used in inherited methods.
 */
@Component({
  tag: 'my-badge',
  shadow: true,
})
export class MyBadge extends FormattedBase {
  /** The badge label — passed through this.format() before rendering */
  @Prop() label: string = '';

  render() {
    return <span class="badge">{this.format(this.label)}</span>;
  }
}
