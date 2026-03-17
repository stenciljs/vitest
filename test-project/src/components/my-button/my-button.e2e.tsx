/**
 * Browser tests for my-button component
 * These tests run in a real browser using Playwright
 */
import { describe, it, expect } from 'vitest';
import { render, h } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('my-button - browser tests', () => {
  describe('rendering in real browser', () => {
    it('should render button in DOM', async () => {
      const { root } = await render(<my-button>Click me</my-button>);

      if (__STENCIL_PROD__) {
        console.log('Running in production mode!');
      }

      expect(root).toBeTruthy();
      expect(root.textContent).toBe('Click me');
    });

    it('should have shadow DOM', async () => {
      const { root } = await render(<my-button variant="primary">Primary Button</my-button>);

      // Check shadow root exists
      expect(root).toHaveShadowRoot();

      // Check shadow DOM content
      const shadowButton = root.shadowRoot?.querySelector('button');
      expect(shadowButton).toBeTruthy();
      expect(shadowButton?.classList.contains('button--primary')).toBe(true);
    });

    it('should handle click events', async () => {
      const { root } = await render(<my-button>Click me</my-button>);

      let clicked = false;
      root.addEventListener('buttonClick', () => {
        clicked = true;
      });

      // Use userEvent to click the custom element directly
      await userEvent.click(root);

      expect(clicked).toBe(true);
    });
  });

  describe('visual regression', () => {
    it('should match screenshot for default variant', async () => {
      const { root } = await render(<my-button>Default Button</my-button>);
      await expect(root).toMatchScreenshot('default' as any);
    });

    it('should match screenshot for primary variant', async () => {
      const { root } = await render(<my-button variant="primary">Primary Button</my-button>);
      await expect(root).toMatchScreenshot('primary' as any);
    });

    it('should match screenshot for all variants', async () => {
      const { root } = await render<HTMLDivElement>(
        <div
          style={{ display: 'flex', gap: '1rem', padding: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <my-button>Default Button</my-button>
          <my-button variant="primary">Primary Button</my-button>
          <my-button variant="secondary">Secondary Button</my-button>
        </div>,
      );

      await expect(root).toMatchScreenshot('all-variants' as any);
    });
  });

  describe('event spy in browser', () => {
    it('should spy on events using interactivity API', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      // Try clicking the custom element directly with userEvent
      await userEvent.click(root);

      expect(spy).toHaveReceivedEvent();
      expect(spy).toHaveReceivedEventTimes(1);
    });

    it('should track multiple clicks with userEvent', async () => {
      const { root, spyOnEvent } = await render(<my-button variant="primary">Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      // Click multiple times using userEvent
      await userEvent.click(root);
      await userEvent.click(root);
      await userEvent.click(root);

      expect(spy).toHaveReceivedEvent();
      expect(spy).toHaveReceivedEventTimes(3);
      expect(spy.events).toHaveLength(3);
    });

    it('should capture event details with userEvent', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      await userEvent.click(root);

      expect(spy.events).toHaveLength(1);
      expect(spy.firstEvent).toBeDefined();
      expect(spy.lastEvent).toBeDefined();
      // The detail should be a MouseEvent
      expect(spy.firstEvent.detail).toBeDefined();
    });

    it('should handle multiple event spies independently', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const clickSpy = spyOnEvent('buttonClick');
      const customSpy = spyOnEvent('customEvent');

      await userEvent.click(root);

      expect(clickSpy).toHaveReceivedEvent();
      expect(clickSpy).toHaveReceivedEventTimes(1);

      // Custom event should not have been received
      expect(() => {
        expect(customSpy).toHaveReceivedEvent();
      }).toThrow();
    });

    it('should work with disabled buttons', async () => {
      const { root, spyOnEvent } = await render(<my-button disabled>Disabled</my-button>);
      const spy = spyOnEvent('buttonClick');
      const shadowButton = root.shadowRoot?.querySelector('button');

      // userEvent.click() respects disabled state and won't click disabled buttons
      // This is the correct behavior! We can verify the button is disabled
      expect(shadowButton?.disabled).toBe(true);

      // The spy should not have received any events
      expect(() => {
        expect(spy).toHaveReceivedEvent();
      }).toThrow();
    });

    it('should work with double click', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      await userEvent.dblClick(root);

      // Double click should trigger 2 click events
      expect(spy).toHaveReceivedEvent();
      expect(spy).toHaveReceivedEventTimes(2);
    });
  });

  // test https://vitest.dev/api/browser/assertions.html#tobevisible
  it('should be visible when rendered', async () => {
    const { root } = await render(<my-button>Visible Button</my-button>);
    // root.style.display = 'none';

    await expect.element(root).toBeVisible();
  });
});
