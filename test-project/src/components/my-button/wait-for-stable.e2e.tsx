/**
 * Tests for waitForStable utility function
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitForStable } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('waitForStable', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with Element argument', () => {
    it('should resolve when element has dimensions', async () => {
      const result = await render(<my-button>Click me</my-button>);

      // Should resolve without throwing
      await waitForStable(result.root);

      expect(result.root).toBeTruthy();
    });

    it('should warn when element is not attached to DOM', async () => {
      const detachedElement = document.createElement('div');

      // Start the wait but don't await - we just want to trigger the warning
      const promise = waitForStable(detachedElement, 100);

      expect(console.warn).toHaveBeenCalledWith('[waitForStable] Element is not attached to the DOM');

      // Clean up - let the timeout complete
      await promise;
    });
  });

  describe('with selector argument', () => {
    it('should resolve when element matching selector has dimensions', async () => {
      const result = await render(<my-button data-testid="test-btn">Click me</my-button>);

      // Should resolve without throwing
      await waitForStable('my-button[data-testid="test-btn"]');

      expect(result.root).toBeTruthy();
    });

    it('should wait for element to appear in DOM when using selector', async () => {
      // Start waiting for an element that doesn't exist yet
      const waitPromise = waitForStable('#delayed-element', 2000);

      // Add the element after a short delay
      setTimeout(() => {
        const el = document.createElement('div');
        el.id = 'delayed-element';
        el.style.width = '100px';
        el.style.height = '100px';
        document.body.appendChild(el);
      }, 50);

      // Should resolve once element appears and has dimensions
      await waitPromise;

      const el = document.querySelector('#delayed-element');
      expect(el).toBeTruthy();

      // Cleanup
      el?.remove();
    });

    it('should timeout gracefully when selector never matches', async () => {
      const start = Date.now();

      // Should not throw, just timeout gracefully
      await waitForStable('#non-existent-element', 100);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});
