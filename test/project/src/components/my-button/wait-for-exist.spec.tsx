/**
 * Tests for waitForExist utility function
 */
import { describe, it, expect } from 'vitest';
import { render, waitForExist } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('waitForExist', () => {
  it('should return element when it already exists', async () => {
    await render(<my-button data-testid="existing-btn">Click me</my-button>);

    const element = await waitForExist('my-button[data-testid="existing-btn"]');

    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('my-button');
  });

  it('should wait for element to appear in DOM', async () => {
    // Start waiting for an element that doesn't exist yet
    const waitPromise = waitForExist('#delayed-element', 2000);

    // Add the element after a short delay
    setTimeout(() => {
      const el = document.createElement('div');
      el.id = 'delayed-element';
      document.body.appendChild(el);
    }, 50);

    const element = await waitPromise;

    expect(element).toBeTruthy();
    expect(element?.id).toBe('delayed-element');

    // Cleanup
    element?.remove();
  });

  it('should return null when selector never matches', async () => {
    const start = Date.now();

    const element = await waitForExist('#non-existent-element', 100);

    const elapsed = Date.now() - start;
    expect(element).toBeNull();
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
