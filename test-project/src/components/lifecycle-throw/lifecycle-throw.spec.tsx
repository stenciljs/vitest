import { render, expect, describe, it, assert, h } from '@stencil/vitest';

describe('lifecycle-throw - componentWillLoad error', () => {
  it('should render successfully when the required prop is provided', async () => {
    const { root } = await render(<lifecycle-throw label="hello"></lifecycle-throw>);
    expect(root).toBeTruthy();
    expect(root.shadowRoot?.querySelector('span')?.textContent).toBe('hello');
  });

  it('should throw when the required prop is missing', async () => {
    try {
      const page = await render(<lifecycle-throw></lifecycle-throw>);
      await page.waitForChanges();
      assert.fail('Expected an error');
    } catch (error) {
      expect(error.message).toEqual('Property [label] required');
    }
  });
});
