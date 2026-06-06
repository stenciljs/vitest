import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - custom matchers (jsdom)', () => {
  describe('toEqualHtml', () => {
    it('should match complete HTML including shadow DOM in jsdom', async () => {
      const { root, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>);

      await waitForChanges();

      expect(root).toEqualHtml(`
        <my-button class="hydrated">
          <mock:shadow-root>
            <button class="button button--primary button--medium" type="button">
              <slot></slot>
            </button>
          </mock:shadow-root>
          Click me
        </my-button>
      `);
    });

    it('should match HTML with different variants in jsdom', async () => {
      const { root, waitForChanges } = await render(
        <my-button variant="secondary" size="small">
          Small
        </my-button>,
      );

      await waitForChanges();

      expect(root).toEqualHtml(`
        <my-button class="hydrated">
          <mock:shadow-root>
            <button class="button button--secondary button--small" type="button">
              <slot></slot>
            </button>
          </mock:shadow-root>
          Small
        </my-button>
      `);
    });
  });

  describe('toEqualLightHtml', () => {
    it('should match light DOM only in jsdom', async () => {
      const { root, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>);

      await waitForChanges();

      // In jsdom, text content remains in light DOM (unlike mock-doc which may handle it differently)
      expect(root).toEqualLightHtml(`
        <my-button class="hydrated">
          Click me
        </my-button>
      `);
    });

    it('should match light DOM with slot content in jsdom', async () => {
      const { root, waitForChanges } = await render(
        <my-button>
          <span>Slotted content</span>
        </my-button>,
      );

      await waitForChanges();

      // In jsdom, text content is preserved in light DOM
      expect(root).toEqualLightHtml(`
        <my-button class="hydrated">
          <span>
            Slotted content
          </span>
        </my-button>
      `);
    });
  });

  describe('HTML string comparison in jsdom', () => {
    it('should compare two HTML strings', () => {
      const html1 = '<div class="test"><span>Hello</span></div>';
      const html2 = '<div class="test"><span>Hello</span></div>';

      expect(html1).toEqualHtml(html2);
    });

    it('should normalize whitespace when comparing', () => {
      const html1 = '<div class="test">   <span>Hello</span>   </div>';
      const html2 = '<div class="test"><span>Hello</span></div>';

      expect(html1).toEqualHtml(html2);
    });
  });
});
