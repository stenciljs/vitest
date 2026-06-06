/**
 * Component tests for my-button using @stencil/vitest
 * Testing file watcher
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, type RenderResult } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - spec tests', () => {
  let result: RenderResult;

  describe('rendering', () => {
    it('should render with default props', async () => {
      result = await render(<my-button>Click me</my-button>);

      expect(result.root).toBeTruthy();
      expect(result.root.tagName.toLowerCase()).toBe('my-button');
    });

    it('should render slot content', async () => {
      result = await render(<my-button>Test Button</my-button>);

      const shadowRoot = result.root.shadowRoot;
      expect(shadowRoot).toBeTruthy();

      // Check that slot content is rendered
      const button = shadowRoot!.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should apply variant class', async () => {
      result = await render(<my-button variant="primary">Primary</my-button>);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--primary')).toBe(true);
    });

    it('should apply size class', async () => {
      result = await render(<my-button size="large">Large</my-button>);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--large')).toBe(true);
    });
  });

  describe('props', () => {
    beforeEach(async () => {
      result = await render(<my-button>Test</my-button>);
    });

    it('should update variant prop', async () => {
      await result.setProps({ variant: 'danger' });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--danger')).toBe(true);
    });

    it('should handle disabled state', async () => {
      await result.setProps({ disabled: true });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.hasAttribute('disabled')).toBe(true);
    });

    it('should update size prop', async () => {
      await result.setProps({ size: 'small' });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--small')).toBe(true);
    });
  });

  describe('events', () => {
    it('should emit buttonClick event on click', async () => {
      result = await render(<my-button>Click me</my-button>);

      const clickHandler = vi.fn();
      result.root.addEventListener('buttonClick', clickHandler);

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');
      button?.click();

      await result.waitForChanges();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('should not emit buttonClick when disabled', async () => {
      result = await render(<my-button disabled>Disabled</my-button>);

      const clickHandler = vi.fn();
      result.root.addEventListener('buttonClick', clickHandler);

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');
      button?.click();

      await result.waitForChanges();
      expect(clickHandler).not.toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('should render primary variant', async () => {
      result = await render(<my-button variant="primary" />);

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--primary')).toBe(true);
    });

    it('should render secondary variant', async () => {
      result = await render(<my-button variant="secondary" />);

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--secondary')).toBe(true);
    });

    it('should render danger variant', async () => {
      result = await render(<my-button variant="danger" />);

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--danger')).toBe(true);
    });
  });
});
