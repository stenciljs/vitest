import { describe, it, expect } from 'vitest';
import { render, type RenderResult, h } from '@stencil/vitest';

describe('non-shadow-component serialization', () => {
  let result: RenderResult;

  describe('slotted content rendering', () => {
    it('should serialize slotted content from non-shadow components', async () => {
      result = await render(
        <non-shadow-component>
          <span slot="header">Custom Header</span>
          <p>Custom Content</p>
          <span slot="footer">Custom Footer</span>
        </non-shadow-component>,
      );

      const component = result.root;
      expect(component).toBeTruthy();

      // The component should serialize including the scoped slot content
      // For scoped components, Stencil uses <slot-fb> elements for fallback content
      expect(component).toEqualHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated">
          <div class="wrapper sc-non-shadow-component">
            <div class="header sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="header" class="sc-non-shadow-component" hidden>
                Default Header
              </slot-fb>
              <span slot="header">
                Custom Header
              </span>
            </div>
            <div class="content sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb class="sc-non-shadow-component" hidden>
                Default Content
              </slot-fb>
              <p>
                Custom Content
              </p>
            </div>
            <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="footer" class="sc-non-shadow-component" hidden>
                Default Footer
              </slot-fb>
              <span slot="footer">
                Custom Footer
              </span>
            </div>
          </div>
        </non-shadow-component>
      `);
    });

    it('should use default slot content when no slotted content provided', async () => {
      result = await render(<non-shadow-component></non-shadow-component>);

      expect(result.root).toEqualHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated">
          <div class="wrapper sc-non-shadow-component">
            <div class="header sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="header" class="sc-non-shadow-component">
                Default Header
              </slot-fb>
            </div>
            <div class="content sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb class="sc-non-shadow-component">
                Default Content
              </slot-fb>
            </div>
            <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="footer" class="sc-non-shadow-component">
                Default Footer
              </slot-fb>
            </div>
          </div>
        </non-shadow-component>
      `);
    });

    it('should handle partial slotted content', async () => {
      result = await render(
        <non-shadow-component>
          <span slot="header">Custom Header Only</span>
        </non-shadow-component>,
      );

      expect(result.root).toEqualHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated">
          <div class="wrapper sc-non-shadow-component">
            <div class="header sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="header" class="sc-non-shadow-component" hidden>
                Default Header
              </slot-fb>
              <span slot="header">
                Custom Header Only
              </span>
            </div>
            <div class="content sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb class="sc-non-shadow-component">
                Default Content
              </slot-fb>
            </div>
            <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="footer" class="sc-non-shadow-component">
                Default Footer
              </slot-fb>
            </div>
          </div>
        </non-shadow-component>
      `);
    });
  });

  describe('__childNodes accessor handling', () => {
    it('should check for __childNodes when serializing non-shadow components', async () => {
      result = await render(
        <non-shadow-component>
          <span>Test Content</span>
        </non-shadow-component>,
      );

      const component = result.root as any;

      // Check if Stencil has monkey-patched the accessors
      // For scoped components with slot polyfill, Stencil should have __childNodes
      if ('__childNodes' in component) {
        expect(component.__childNodes).toBeDefined();

        // The serializer should be able to access the polyfilled content
        // via __childNodes even though regular childNodes is protected
        expect(component).toMatchInlineSnapshot(`
          <non-shadow-component class="sc-non-shadow-component-h hydrated">
            <div class="wrapper sc-non-shadow-component">
              <div class="header sc-non-shadow-component sc-non-shadow-component-s">
                <slot-fb name="header" class="sc-non-shadow-component">
                  Default Header
                </slot-fb>
              </div>
              <div class="content sc-non-shadow-component sc-non-shadow-component-s">
                <slot-fb class="sc-non-shadow-component" hidden>
                  Default Content
                </slot-fb>
                <span>
                  Test Content
                </span>
              </div>
              <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
                <slot-fb name="footer" class="sc-non-shadow-component">
                  Default Footer
                </slot-fb>
              </div>
            </div>
          </non-shadow-component>
        `);
      }
    });
  });

  describe('light DOM serialization', () => {
    it('should serialize only light DOM with toEqualLightHtml', async () => {
      result = await render(
        <non-shadow-component>
          <span slot="header">Custom Header</span>
          <p>Custom Content</p>
          <span slot="footer">Custom Footer</span>
        </non-shadow-component>,
      );

      // toEqualLightHtml should only return the outer tag and slotted nodes (light DOM)
      // It should NOT include the internal <slot-fb> elements or wrapper divs
      expect(result.root).toEqualLightHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated">
          <span slot="header">
            Custom Header
          </span>
          <p>
            Custom Content
          </p>
          <span slot="footer">
            Custom Footer
          </span>
        </non-shadow-component>
      `);
    });

    it('should serialize empty light DOM when no slotted content', async () => {
      result = await render(<non-shadow-component></non-shadow-component>);

      expect(result.root).toEqualLightHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated"></non-shadow-component>
      `);
    });
  });

  describe('nested components', () => {
    it('should serialize nested non-shadow components', async () => {
      result = await render(
        <non-shadow-component>
          <non-shadow-component slot="header">
            <span>Nested Header</span>
          </non-shadow-component>
          <p>Main Content</p>
        </non-shadow-component>,
      );

      expect(result.root).toEqualHtml(`
        <non-shadow-component class="sc-non-shadow-component-h hydrated">
          <div class="wrapper sc-non-shadow-component">
            <div class="header sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="header" class="sc-non-shadow-component" hidden>
                Default Header
              </slot-fb>
              <non-shadow-component slot="header" class="sc-non-shadow-component-h hydrated">
                <div class="wrapper sc-non-shadow-component">
                  <div class="header sc-non-shadow-component sc-non-shadow-component-s">
                    <slot-fb name="header" class="sc-non-shadow-component">
                      Default Header
                    </slot-fb>
                  </div>
                  <div class="content sc-non-shadow-component sc-non-shadow-component-s">
                    <slot-fb class="sc-non-shadow-component" hidden>
                      Default Content
                    </slot-fb>
                    <span>
                      Nested Header
                    </span>
                  </div>
                  <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
                    <slot-fb name="footer" class="sc-non-shadow-component">
                      Default Footer
                    </slot-fb>
                  </div>
                </div>
              </non-shadow-component>
            </div>
            <div class="content sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb class="sc-non-shadow-component" hidden>
                Default Content
              </slot-fb>
              <p>
                Main Content
              </p>
            </div>
            <div class="footer sc-non-shadow-component sc-non-shadow-component-s">
              <slot-fb name="footer" class="sc-non-shadow-component">
                Default Footer
              </slot-fb>
            </div>
          </div>
        </non-shadow-component>
      `);
    });
  });
});
