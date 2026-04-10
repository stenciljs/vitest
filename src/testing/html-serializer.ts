/**
 * Shared HTML serialization utilities for Stencil components
 * Used by both matchers and snapshot serializers
 */

/**
 * HTML void elements (self-closing tags) that don't have closing tags
 */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Stencil non-shadow component with slot polyfill
 * For scoped components, Stencil monkey-patches DOM accessors and moves
 * the original accessors to __childNodes, __children, etc.
 */
interface StencilNonShadowElement extends HTMLElement {
  __childNodes?: NodeList;
  __children?: HTMLCollection;
  __firstChild?: ChildNode | null;
  __lastChild?: ChildNode | null;
}

export interface SerializeOptions {
  /** Whether to include shadow DOM in serialization */
  serializeShadowRoot?: boolean;
  /** Whether to prettify the output */
  pretty?: boolean;
  /** Whether to exclude style tags */
  excludeStyles?: boolean;
}

/**
 * Serialize HTML element to string
 * Works across mock-doc, jsdom, and happy-dom environments
 * Uses consistent <mock:shadow-root> format across all environments
 */
export function serializeHtml(
  input: HTMLElement | ShadowRoot | DocumentFragment | string,
  options: SerializeOptions = {},
): string {
  const { serializeShadowRoot = true, pretty = true, excludeStyles = true } = options;

  // If input is already a string, just normalize and return
  if (typeof input === 'string') {
    return input;
  }

  // Use custom serialization for consistent <mock:shadow-root> format across all environments
  const html = serializeElementWithShadow(input as HTMLElement, excludeStyles, serializeShadowRoot);
  return pretty ? prettifyHtml(html) : html;
}

/**
 * Recursively serialize an element and its shadow DOM for jsdom/happy-dom
 * Note: Pretty printing is done at the top level only, not during recursion
 */
function serializeElementWithShadow(
  element: HTMLElement | DocumentFragment,
  excludeStyles: boolean,
  serializeShadowRoot: boolean = true,
): string {
  // Handle DocumentFragment
  if ((element as any).nodeType === 11) {
    let html = '';
    const children = Array.from(element.childNodes);
    for (const child of children) {
      if ((child as any).nodeType === 1) {
        // Element node
        html += serializeElementWithShadow(child as HTMLElement, excludeStyles, serializeShadowRoot);
      } else if ((child as any).nodeType === 3) {
        // Text node - include to match mock-doc
        const text = (child as any).textContent;
        if (text) html += text;
      } else if ((child as any).nodeType === 8 && !!(child as any).textContent) {
        // Comment node
        html += `<!--${(child as any).textContent}-->`;
      }
    }
    return html;
  }

  const elem = element as HTMLElement;
  // Use localName to preserve case for SVG elements (e.g., foreignObject, feGaussianBlur)
  // For HTML elements, localName is already lowercase
  const tagName = (elem as any).localName || elem.tagName.toLowerCase();

  // Build opening tag with attributes
  let html = `<${tagName}`;

  // Add attributes sorted alphabetically for deterministic output across dev/prod builds
  if (elem.attributes) {
    const attrs = Array.from(elem.attributes).sort((a, b) => {
      const nameA = a.prefix && a.localName ? `${a.prefix}:${a.localName}` : a.name;
      const nameB = b.prefix && b.localName ? `${b.prefix}:${b.localName}` : b.name;
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

    for (const attr of attrs) {
      // Handle namespaced attributes (e.g., xlink:href)
      // Use prefix + localName if available, otherwise fall back to name
      let attrName = attr.name;
      if (attr.prefix && attr.localName) {
        attrName = `${attr.prefix}:${attr.localName}`;
      }

      // Boolean attributes (empty string value) should not have ="value"
      if (attr.value === '') {
        html += ` ${attrName}`;
      } else {
        html += ` ${attrName}="${attr.value}"`;
      }
    }
  }

  html += '>';

  // Add shadow DOM if present and requested
  // Also check for Stencil non-shadow components with __childNodes (slot polyfill)
  const stencilElem = elem as StencilNonShadowElement;
  const hasShadowRoot = serializeShadowRoot && 'shadowRoot' in elem && elem.shadowRoot;
  const hasStencilPolyfill = serializeShadowRoot && '__childNodes' in stencilElem && stencilElem.__childNodes;

  if (hasShadowRoot) {
    // Use mock:shadow-root format to match mock-doc's output
    // Include shadow root mode (open/closed) and other properties
    const shadowRoot = elem.shadowRoot!;
    let shadowRootTag = '<mock:shadow-root';

    // Add delegatesFocus if true
    if ((shadowRoot as any).delegatesFocus) {
      shadowRootTag += ' shadowrootdelegatesfocus';
    }

    shadowRootTag += '>';
    html += shadowRootTag;

    // Serialize shadow DOM children
    const shadowChildren = Array.from(elem.shadowRoot.childNodes);
    for (const child of shadowChildren) {
      if ((child as any).nodeType === 1) {
        // Element node - check if it's a style tag
        const childElem = child as HTMLElement;
        if (excludeStyles && childElem.tagName.toLowerCase() === 'style') {
          continue; // Skip style tags
        }
        html += serializeElementWithShadow(childElem, excludeStyles, serializeShadowRoot);
      } else if ((child as any).nodeType === 3) {
        // Text node - include it (matches mock-doc behavior)
        const text = (child as any).textContent;
        if (text) html += text;
      } else if ((child as any).nodeType === 8 && !!(child as any).textContent) {
        // Comment node
        html += `<!--${(child as any).textContent}-->`;
      }
    }

    html += '</mock:shadow-root>';
  }

  // Add light DOM children
  // For Stencil non-shadow components with slot polyfill, use __childNodes to access actual DOM
  let childNodes: NodeList;
  if (hasStencilPolyfill) {
    childNodes = stencilElem.__childNodes!;
  } else {
    childNodes = elem.childNodes;
  }

  const children = Array.from(childNodes);
  for (const child of children) {
    if ((child as any).nodeType === 1) {
      // Element node
      html += serializeElementWithShadow(child as HTMLElement, excludeStyles, serializeShadowRoot);
    } else if ((child as any).nodeType === 3) {
      // Text node - include it to match mock-doc behavior
      const text = (child as any).textContent;
      if (text) html += text;
    } else if ((child as any).nodeType === 8 && !!(child as any).textContent) {
      // Comment node
      html += `<!--${(child as any).textContent}-->`;
    }
  }

  // Void elements don't have closing tags
  if (!VOID_ELEMENTS.has(tagName)) {
    html += `</${tagName}>`;
  }

  return html;
}

/**
 * Custom HTML prettifier
 */
export function prettifyHtml(html: string): string {
  const indentSize = 2;
  let indentLevel = 0;
  const lines: string[] = [];

  // Normalize whitespace
  html = html.replace(/\s+/g, ' ').replace(/>\s*</g, '><').trim();

  // Split on tag boundaries while preserving tags
  const parts = html.split(/(<[^>]+>)/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (part.startsWith('<')) {
      // This is a tag
      if (part.startsWith('</')) {
        // Closing tag - decrease indent first
        indentLevel = Math.max(0, indentLevel - 1);

        // Check if we should merge with previous line (empty element)
        const tagName = part.match(/<\/([^>\s]+)/)?.[1];
        const lastLine = lines[lines.length - 1];
        if (lastLine && tagName) {
          const openTagPattern = new RegExp(`^\\s*<${tagName.replace(/:/g, '\\:')}[^>]*>$`);
          if (openTagPattern.test(lastLine)) {
            // Empty element - append closing tag to same line
            lines[lines.length - 1] = lastLine + part;
            continue;
          }
        }

        lines.push(' '.repeat(indentLevel * indentSize) + part);
      } else if (part.endsWith('/>')) {
        // Self-closing tag (XML style)
        lines.push(' '.repeat(indentLevel * indentSize) + part);
      } else {
        // Opening tag
        lines.push(' '.repeat(indentLevel * indentSize) + part);

        // Check if it's a void element - if so, don't increase indent
        const tagName = part.match(/<([^\s>/]+)/)?.[1]?.toLowerCase();
        if (!tagName || !VOID_ELEMENTS.has(tagName)) {
          // Not a void element, increase indent for next content
          indentLevel++;
        }
      }
    } else {
      // Text content - add on its own line with current indentation
      lines.push(' '.repeat(indentLevel * indentSize) + part);
    }
  }

  return lines.join('\n');
}

/**
 * Sort attributes alphabetically within every opening HTML tag in a string.
 * Used to normalise expected HTML strings before comparison so that attribute
 * order written by hand in tests does not have to match the order produced by
 * the runtime (which can differ between dev and prod Stencil builds).
 *
 * Handles double-quoted attribute values and bare boolean attributes.
 * Does NOT touch closing tags, self-closing tags, or text content.
 */
export function sortAttributesInHtml(html: string): string {
  // Match opening tags: capture tag name and the rest of the attribute string
  return html.replace(/<([a-zA-Z][a-zA-Z0-9:._-]*)((?:\s[^>]*)?)>/g, (_match, tagName: string, attrStr: string) => {
    if (!attrStr.trim()) {
      return `<${tagName}>`;
    }

    // Parse individual attributes (boolean attrs and attr="value" attrs)
    const attrPattern = /\s+([^\s=>"/]+)(?:="([^"]*?)")?/g;
    const attrs: Array<{ name: string; value: string | null }> = [];
    let m: RegExpExecArray | null;
    while ((m = attrPattern.exec(attrStr)) !== null) {
      attrs.push({ name: m[1], value: m[2] !== undefined ? m[2] : null });
    }

    attrs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    const sortedAttrStr = attrs
      .map(({ name, value }) => (value === null ? ` ${name}` : ` ${name}="${value}"`))
      .join('');

    return `<${tagName}${sortedAttrStr}>`;
  });
}

/**
 * Normalize HTML for comparison by removing extra whitespace
 */
export function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
}
