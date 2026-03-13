import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - custom matchers', () => {
  describe('toEqualHtml', () => {
    it('should match complete HTML including shadow DOM', async () => {
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

    it('should match HTML with different variants', async () => {
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

    it('should match disabled button', async () => {
      const { root, waitForChanges } = await render(<my-button disabled>Disabled</my-button>);

      await waitForChanges();

      expect(root).toEqualHtml(`
        <my-button class="hydrated">
          <mock:shadow-root>
            <button class="button button--primary button--medium" disabled type="button">
              <slot></slot>
            </button>
          </mock:shadow-root>
          Disabled
        </my-button>
      `);
    });

    it('should fail when HTML does not match', async () => {
      const { root, waitForChanges } = await render(<my-button>Test</my-button>);

      await waitForChanges();

      expect(() => {
        expect(root).toEqualHtml(`
          <my-button>
            <mock:shadow-root>
              <button class="wrong-class">
                <slot></slot>
              </button>
            </mock:shadow-root>
          </my-button>
        `);
      }).toThrow();
    });
  });

  describe('toEqualLightHtml', () => {
    it('should match light DOM only (no shadow DOM)', async () => {
      const { root, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>);

      await waitForChanges();

      expect(root).toEqualLightHtml(`
        <my-button class="hydrated">
          Click me
        </my-button>
      `);
    });

    it('should match light DOM with slot content', async () => {
      const { root, waitForChanges } = await render(
        <my-button>
          <span>Slotted content</span>
        </my-button>,
      );

      await waitForChanges();

      expect(root).toEqualLightHtml(`
        <my-button class="hydrated">
          <span>
            Slotted content
          </span>
        </my-button>
      `);
    });

    it('should not include shadow DOM in comparison', async () => {
      const { root, waitForChanges } = await render(<my-button>Test</my-button>);

      await waitForChanges();

      // This should NOT include the <button> from shadow DOM
      expect(root).toEqualLightHtml(`
        <my-button class="hydrated">
          Test
        </my-button>
      `);
    });

    it('should fail when light DOM does not match', async () => {
      const { root, waitForChanges } = await render(<my-button variant="primary">Test</my-button>);

      await waitForChanges();

      expect(() => {
        expect(root).toEqualLightHtml(`
          <my-button class="different">
          </my-button>
        `);
      }).toThrow();
    });
  });

  describe('toEqualHtml with nested components', () => {
    it('should match card with nested button', async () => {
      const { root, waitForChanges } = await render(
        <my-card cardTitle="Test Card">
          <p>Card content</p>
          <my-button slot="footer" variant="primary">
            Action
          </my-button>
        </my-card>,
      );

      await waitForChanges();

      expect(root).toEqualHtml(`
        <my-card class="hydrated">
          <mock:shadow-root>
            <div class="card card--elevation-1">
              <div class="card__header">
                <h3 class="card__title">
                  Test Card
                </h3>
                <slot name="header-actions"></slot>
              </div>
              <div class="card__content">
                <slot></slot>
              </div>
              <div class="card__footer">
                <slot name="footer"></slot>
              </div>
            </div>
          </mock:shadow-root>
          <p> Card content </p>
          <my-button slot="footer" class="hydrated">
            <mock:shadow-root>
              <button class="button button--primary button--medium" type="button">
                <slot></slot>
              </button>
            </mock:shadow-root> Action </my-button>
        </my-card>
      `);
    });
  });

  describe('HTML string comparison', () => {
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

    it('should fail when HTML strings differ', () => {
      const html1 = '<div class="test"><span>Hello</span></div>';
      const html2 = '<div class="different"><span>Hello</span></div>';

      expect(() => {
        expect(html1).toEqualHtml(html2);
      }).toThrow();
    });
  });
});
