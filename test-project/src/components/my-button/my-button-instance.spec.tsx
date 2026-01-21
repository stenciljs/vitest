import { render, describe, it, expect, vi } from '@stencil/vitest';
import { h } from '@stencil/core';
import type { MyButton } from './my-button';

describe('my-button instance', () => {
  it('should access the component instance and call methods', async () => {
    const { instance, root, waitForChanges } = await render<HTMLMyButtonElement, MyButton>(
      <my-button>Click me</my-button>,
    );

    expect(instance).toBeTruthy();
    expect(instance).not.toBe(root);

    const renderSpy = vi.spyOn(instance, 'render');
    expect(renderSpy).not.toHaveBeenCalled();

    root.disabled = true;
    await waitForChanges();

    expect(renderSpy).toHaveBeenCalled();
  });
});
