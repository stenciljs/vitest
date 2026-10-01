/**
 * Verifies the stencilVitestPlugin resolves `resolveVar()` arguments that are imported
 * from another module.
 *
 * Stencil's `transpile()` type-checks a single file with module resolution disabled, so
 * on its own it cannot see `EVENTS.MY_EMITTER.PING_EVENT` coming from `../../utils/events`.
 * The plugin inlines the literal before compiling, so this component loads and its
 * `@Event` / `@Listen` decorators carry the catalog's event names.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';
import { EVENTS } from '../../utils/events.js';

// Importing the source triggers the on-the-fly compile + customElements.define().
import './my-emitter.tsx';

describe('my-emitter - resolveVar() with an imported event catalog', () => {
  it('emits under the event name declared in the imported catalog', async () => {
    const { root, spyOnEvent } = await render<HTMLMyEmitterElement>(<my-emitter />);
    const spy = spyOnEvent(EVENTS.MY_EMITTER.PING_EVENT);

    await root.emitPing('hello');

    expect(spy).toHaveReceivedEvent();
    expect(spy).toHaveReceivedEventDetail('hello');
  });

  it('listens under the event name declared in the imported catalog', async () => {
    const { root, waitForChanges } = await render<HTMLMyEmitterElement>(<my-emitter />);

    await root.emitPong();
    await waitForChanges();

    expect(root.shadowRoot!.querySelector('.pong-count')?.textContent).toBe('1');
  });
});
