/**
 * Demonstrates module mocking with stencilVitestPlugin.
 *
 * The plugin transforms my-label.tsx on-the-fly via the Stencil compiler
 * (componentExport: 'customelement'), so it enters Vitest's module graph as
 * a discrete ES module. That means vi.mock() can intercept any import the
 * component makes — here we mock the capitalize() utility it calls in render().
 *
 * This is impossible with the pre-built dist approach because the component
 * and its dependencies are already bundled together before Vitest sees them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

// vi.mock() is hoisted to the top of the file by Vitest.
// The path resolves to the same absolute module my-label.tsx imports.
vi.mock('../../utils/index.js', () => ({
  capitalize: vi.fn((s: string) => `[mocked:${s}]`),
}));

// Import the component source — the plugin transforms it on-the-fly
// and the resulting customElements.define() call registers <my-label>
// the moment this import resolves.
import './my-label.tsx';
import { capitalize } from '../../utils/index.js';

describe('my-label — module mocking via stencilVitestPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders using the real capitalize by default (sanity check)', async () => {
    // Temporarily restore the real implementation for this one test
    vi.mocked(capitalize).mockImplementation((s) => s.charAt(0).toUpperCase() + s.slice(1));

    const { root } = await render(<my-label value="hello" />);
    const span = root.shadowRoot!.querySelector('span');
    expect(span?.textContent).toBe('Hello');
  });

  it('renders using the mocked capitalize', async () => {
    vi.mocked(capitalize).mockReturnValue('[mocked:hello]');

    const { root } = await render(<my-label value="hello" />);
    const span = root.shadowRoot!.querySelector('span');

    expect(span?.textContent).toBe('[mocked:hello]');
    expect(capitalize).toHaveBeenCalledWith('hello');
  });

  it('reflects prop changes through the mock', async () => {
    vi.mocked(capitalize).mockImplementation((s) => `UPPER:${s.toUpperCase()}`);

    const { root, setProps, waitForChanges } = await render(<my-label value="world" />);
    expect(root.shadowRoot!.querySelector('span')?.textContent).toBe('UPPER:WORLD');

    await setProps({ value: 'changed' });
    await waitForChanges();

    expect(root.shadowRoot!.querySelector('span')?.textContent).toBe('UPPER:CHANGED');
    expect(capitalize).toHaveBeenCalledTimes(2);
  });
});
