import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - jsdom tests', () => {
  describe('rendering in jsdom', () => {
    it('should render with default props', async () => {
      const result = await render(<my-button>Click me</my-button>);

      expect(result.root).toBeTruthy();
      expect(result.root.tagName.toLowerCase()).toBe('my-button');
    });

    it('should render with variant', async () => {
      const result = await render(<my-button variant="primary">Primary Button</my-button>);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--primary')).toBe(true);
    });

    it('should handle clicks', async () => {
      let clicked = false;
      const result = await render(<my-button>Click me</my-button>);

      result.root.addEventListener('buttonClick', () => {
        clicked = true;
      });

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      button?.click();

      expect(clicked).toBe(true);
    });

    it('should update props dynamically', async () => {
      const result = await render(<my-button variant="primary">Button</my-button>);

      await result.setProps({ variant: 'secondary' });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--secondary')).toBe(true);
      expect(button?.classList.contains('button--primary')).toBe(false);
    });
  });

  describe('jsdom-specific DOM features', () => {
    beforeEach(() => {
      // Clear the document for each test
      document.body.innerHTML = '';
    });

    it('should work with document.querySelector', async () => {
      const { root } = await render(<my-button id="test-button">Test</my-button>);

      // In jsdom, we can use standard DOM APIs
      const element = document.querySelector('#test-button');
      expect(element).toBeTruthy();
      expect(element?.tagName.toLowerCase()).toBe('my-button');
      console.log(root.outerHTML);
    });

    it('should have access to window object', () => {
      expect(window).toBeDefined();
      expect(window.document).toBeDefined();
      expect(window.location).toBeDefined();
      expect(window.navigator).toBeDefined();
    });

    it('should support DOM manipulation alongside components', async () => {
      await render(<my-button>Stencil Button</my-button>);

      const div = document.createElement('div');
      div.id = 'test-div';
      div.textContent = 'Regular div';
      document.body.appendChild(div);

      const button = document.querySelector('my-button');
      const regularDiv = document.querySelector('#test-div');

      expect(button).toBeTruthy();
      expect(regularDiv?.textContent).toBe('Regular div');
    });
  });

  describe('comparing jsdom with mock-doc', () => {
    it('should demonstrate jsdom has fuller DOM API', () => {
      // jsdom provides more complete DOM APIs than mock-doc
      expect(typeof window.getComputedStyle).toBe('function');
      expect(typeof window.requestAnimationFrame).toBe('function');
      expect(typeof document.createRange).toBe('function');
      expect(typeof window.CSS).toBe('object');
    });

    it('should render components just like mock-doc', async () => {
      const result = await render(
        <my-button variant="danger" size="large">
          Test
        </my-button>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const button = shadowRoot!.querySelector('button');

      expect(button?.classList.contains('button--danger')).toBe(true);
      expect(button?.classList.contains('button--large')).toBe(true);
    });
  });
});
