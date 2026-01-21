/**
 * Tests demonstrating matchers:
 * - toHaveClass
 * - toHaveClasses
 * - toMatchClasses
 * - toHaveAttribute
 * - toEqualAttribute
 * - toEqualAttributes
 * - toHaveProperty
 * - toHaveTextContent
 * - toEqualText
 * - toHaveShadowRoot
 */
import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - matchers', () => {
  describe('toHaveClass', () => {
    it('should pass when element has the specified class', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).toHaveClass('button');
      expect(button).toHaveClass('button--primary');
      expect(button).toHaveClass('button--medium');
    });

    it('should fail when element does not have the class', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toHaveClass('non-existent-class');
      }).toThrow();
    });

    it('should support negation with .not', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).not.toHaveClass('button--secondary');
      expect(button).not.toHaveClass('button--danger');
    });
  });

  describe('toHaveClasses', () => {
    it('should pass when element has all specified classes', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).toHaveClasses(['button', 'button--primary', 'button--medium']);
    });

    it('should fail when element is missing one or more classes', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toHaveClasses(['button', 'missing-class']);
      }).toThrow();
    });
  });

  describe('toMatchClasses', () => {
    it('should pass when element has exactly the specified classes', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      // toMatchClasses checks for exact match (no more, no less)
      expect(button).toMatchClasses(['button', 'button--primary', 'button--medium']);
    });

    it('should fail when element has extra classes', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        // This will fail because button has more classes than just 'button'
        expect(button).toMatchClasses(['button']);
      }).toThrow();
    });
  });

  describe('toHaveAttribute', () => {
    it('should pass when element has the attribute (existence check)', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).toHaveAttribute('type');
      expect(button).toHaveAttribute('class');
    });

    it('should fail when element does not have the attribute', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toHaveAttribute('data-test');
      }).toThrow();
    });

    it('should support negation with .not', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('toEqualAttribute', () => {
    it('should pass when attribute value matches exactly', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).toEqualAttribute('type', 'button');
      expect(button).toEqualAttribute('class', 'button button--primary button--medium');
    });

    it('should fail when attribute value does not match', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toEqualAttribute('type', 'submit');
      }).toThrow();
    });
  });

  describe('toEqualAttributes', () => {
    it('should pass when all attributes match exactly', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(button).toEqualAttributes({
        class: 'button button--primary button--medium',
        type: 'button',
      });
    });

    it('should fail when attributes do not match', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toEqualAttributes({
          class: 'wrong-class',
          type: 'button',
        });
      }).toThrow();
    });

    it('should fail when expected attribute is missing', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      expect(() => {
        expect(button).toEqualAttributes({
          type: 'button',
          'data-missing': 'value',
        });
      }).toThrow();
    });
  });

  describe('toHaveProperty', () => {
    it('should pass when element has the property (existence check)', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);

      expect(root).toHaveProperty('variant');
      expect(root).toHaveProperty('size');
      expect(root).toHaveProperty('disabled');
    });

    it('should pass when property has the expected value', async () => {
      const { root } = await render(
        <my-button variant="primary" size="large">
          Test
        </my-button>,
      );

      expect(root).toHaveProperty('variant', 'primary');
      expect(root).toHaveProperty('size', 'large');
      expect(root).toHaveProperty('disabled', false);
    });

    it('should fail when element does not have the property', async () => {
      const { root } = await render(<my-button>Test</my-button>);

      expect(() => {
        expect(root).toHaveProperty('nonExistentProp');
      }).toThrow();
    });

    it('should fail when property value does not match', async () => {
      const { root } = await render(<my-button variant="primary">Test</my-button>);

      expect(() => {
        expect(root).toHaveProperty('variant', 'secondary');
      }).toThrow();
    });
  });

  describe('toHaveTextContent', () => {
    it('should pass when element contains the text', async () => {
      const { root } = await render(<my-button>Click Me Please</my-button>);

      expect(root).toHaveTextContent('Click');
      expect(root).toHaveTextContent('Me');
      expect(root).toHaveTextContent('Please');
      expect(root).toHaveTextContent('Click Me Please');
    });

    it('should fail when element does not contain the text', async () => {
      const { root } = await render(<my-button>Click Me</my-button>);

      expect(() => {
        expect(root).toHaveTextContent('Submit');
      }).toThrow();
    });

    it('should support negation with .not', async () => {
      const { root } = await render(<my-button>Click Me</my-button>);

      expect(root).not.toHaveTextContent('Submit');
      expect(root).not.toHaveTextContent('Cancel');
    });
  });

  describe('toEqualText', () => {
    it('should pass when text content matches exactly (trimmed)', async () => {
      const { root } = await render(<my-button>Click Me</my-button>);

      expect(root).toEqualText('Click Me');
    });

    it('should trim whitespace before comparing', async () => {
      const { root } = await render(<my-button> Spaced Out </my-button>);

      expect(root).toEqualText('Spaced Out');
    });

    it('should fail when text does not match', async () => {
      const { root } = await render(<my-button>Click Me</my-button>);

      expect(() => {
        expect(root).toEqualText('Different Text');
      }).toThrow();
    });
  });

  describe('toHaveShadowRoot', () => {
    it('should pass when element has a shadow root', async () => {
      const { root } = await render(<my-button>Test</my-button>);

      expect(root).toHaveShadowRoot();
    });

    it('should fail when element does not have a shadow root', async () => {
      const { root } = await render(<my-button>Test</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      // Regular button element doesn't have shadow root
      expect(() => {
        expect(button).toHaveShadowRoot();
      }).toThrow();
    });
  });

  describe('combined usage', () => {
    it('should allow using multiple new matchers together', async () => {
      const { root } = await render(<my-button variant="primary">Submit</my-button>);
      const button = root.shadowRoot?.querySelector('button');

      // Test multiple matchers
      expect(button).toHaveClasses(['button', 'button--primary']);
      expect(button).toMatchClasses(['button', 'button--primary', 'button--medium']);
      expect(button).toEqualAttribute('type', 'button');
      expect(button).toEqualAttributes({
        type: 'button',
        class: 'button button--primary button--medium',
      });

      // Check text on the root element (light DOM contains the text)
      expect(root).toEqualText('Submit');
    });
  });
});
