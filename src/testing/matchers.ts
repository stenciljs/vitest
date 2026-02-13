/**
 * Custom matchers for Stencil component testing
 *
 * These extend Vitest's expect with Stencil-specific assertions
 */

import { expect } from 'vitest';
import { serializeHtml, normalizeHtml, prettifyHtml } from './html-serializer.js';
import type { EventSpy } from '../types.js';

/**
 * Custom matchers interface
 */
interface CustomMatchers<R = unknown> {
  /** Asserts element has the specified CSS class. */
  toHaveClass(className: string): R;
  /** Asserts element has all specified CSS classes. */
  toHaveClasses(classNames: string[]): R;
  /** Asserts element has exactly the specified CSS classes (no more, no less). */
  toMatchClasses(classNames: string[]): R;
  /** Asserts element has the attribute, optionally with a specific value. */
  toHaveAttribute(attribute: string, value?: string): R;
  /** Asserts element attribute equals the expected value exactly. */
  toEqualAttribute(attribute: string, value: string): R;
  /** Asserts element has all specified attributes with exact values. */
  toEqualAttributes(expectedAttrs: Record<string, string>): R;
  /** Asserts element has the property, optionally with a specific value. */
  toHaveProperty(property: string, value?: any): R;
  /** Asserts element's text content contains the specified text. */
  toHaveTextContent(text: string): R;
  /** Asserts element's trimmed text content equals the expected text exactly. */
  toEqualText(expectedText: string): R;
  /** Asserts element has an attached shadow root. */
  toHaveShadowRoot(): R;
  /** Asserts element's serialized HTML (including shadow DOM) matches expected HTML. */
  toEqualHtml(expectedHtml: string): R;
  /** Asserts element's light DOM HTML (excluding shadow DOM internals) matches expected HTML. */
  toEqualLightHtml(expectedHtml: string): R;
  /** Asserts event spy has received at least one event. */
  toHaveReceivedEvent(): R;
  /** Asserts event spy has received exactly the specified number of events. */
  toHaveReceivedEventTimes(count: number): R;
  /** Asserts event spy's last received event has the expected detail. */
  toHaveReceivedEventDetail(detail: any): R;
  /** Asserts event spy's first received event has the expected detail. */
  toHaveFirstReceivedEventDetail(detail: any): R;
  /** Asserts event spy's last received event has the expected detail. */
  toHaveLastReceivedEventDetail(detail: any): R;
  /** Asserts event spy's nth received event (0-indexed) has the expected detail. */
  toHaveNthReceivedEventDetail(index: number, detail: any): R;
}

// Extend Vitest types
declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Check if element has a class
 */
function toHaveClass(received: HTMLElement, className: string): { pass: boolean; message: () => string } {
  const pass = received.classList.contains(className);

  return {
    pass,
    message: () =>
      pass ? `Expected element not to have class "${className}"` : `Expected element to have class "${className}"`,
  };
}

/**
 * Check if element has multiple classes
 * Checks if element has all of the specified CSS classes (order doesn't matter)
 */
function toHaveClasses(received: HTMLElement, classNames: string[]): { pass: boolean; message: () => string } {
  const missingClasses: string[] = [];

  for (const className of classNames) {
    if (!received.classList.contains(className)) {
      missingClasses.push(className);
    }
  }

  const pass = missingClasses.length === 0;
  const actualClasses = Array.from(received.classList).join(', ');

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have classes [${classNames.join(', ')}]`
        : `Expected element to have classes [${classNames.join(', ')}], but missing [${missingClasses.join(', ')}]. Actual classes: [${actualClasses}]`,
  };
}

/**
 * Check if element has exactly the specified CSS classes (no more, no less)
 * Order doesn't matter, but the element must have exactly these classes
 */
function toMatchClasses(received: HTMLElement, classNames: string[]): { pass: boolean; message: () => string } {
  // Get classes from the class attribute to support mock-doc
  const classAttr = received.getAttribute('class') || '';
  const actualClasses = classAttr.split(/\s+/).filter(Boolean).sort();
  const expectedClasses = [...classNames].filter(Boolean).sort();

  const pass =
    actualClasses.length === expectedClasses.length && actualClasses.every((cls, idx) => cls === expectedClasses[idx]);

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have exactly classes [${classNames.join(', ')}]`
        : `Expected element to have exactly classes [${classNames.join(', ')}], but got [${actualClasses.join(', ')}]`,
  };
}

/**
 * Check if element has an attribute
 */
function toHaveAttribute(
  received: HTMLElement,
  attribute: string,
  value?: string,
): { pass: boolean; message: () => string } {
  const hasAttribute = received.hasAttribute(attribute);

  if (!hasAttribute) {
    return {
      pass: false,
      message: () => `Expected element to have attribute "${attribute}"`,
    };
  }

  if (value !== undefined) {
    const actualValue = received.getAttribute(attribute);
    const pass = actualValue === value;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have attribute "${attribute}" with value "${value}"`
          : `Expected element to have attribute "${attribute}" with value "${value}", but got "${actualValue}"`,
    };
  }

  return {
    pass: true,
    message: () => `Expected element not to have attribute "${attribute}"`,
  };
}

/**
 * Check if element has a specific attribute with an exact value
 */
function toEqualAttribute(
  received: HTMLElement,
  attribute: string,
  value: string,
): { pass: boolean; message: () => string } {
  const actualValue = received.getAttribute(attribute);
  const pass = actualValue === value;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element attribute "${attribute}" not to equal "${value}"`
        : `Expected element attribute "${attribute}" to equal "${value}", but got "${actualValue}"`,
  };
}

/**
 * Check if element has all expected attributes with exact values
 */
function toEqualAttributes(
  received: HTMLElement,
  expectedAttrs: Record<string, string>,
): { pass: boolean; message: () => string } {
  const mismatches: string[] = [];
  const actualAttrs: Record<string, string | null> = {};

  // Collect all actual attributes
  for (let i = 0; i < received.attributes.length; i++) {
    const attr = received.attributes[i];
    actualAttrs[attr.name] = attr.value;
  }

  // Check expected attributes
  for (const [name, expectedValue] of Object.entries(expectedAttrs)) {
    const actualValue = received.getAttribute(name);

    if (actualValue === null) {
      mismatches.push(`missing "${name}"`);
    } else if (actualValue !== expectedValue) {
      mismatches.push(`"${name}": expected "${expectedValue}", got "${actualValue}"`);
    }
  }

  const pass = mismatches.length === 0;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have attributes ${JSON.stringify(expectedAttrs)}`
        : `Expected element attributes to match.\nMismatches: ${mismatches.join(', ')}\nExpected: ${JSON.stringify(expectedAttrs)}\nActual: ${JSON.stringify(actualAttrs)}`,
  };
}

/**
 * Check if element has a property
 */
function toHaveProperty(received: any, property: string, value?: any): { pass: boolean; message: () => string } {
  const hasProperty = property in received;

  if (!hasProperty) {
    return {
      pass: false,
      message: () => `Expected element to have property "${property}"`,
    };
  }

  if (value !== undefined) {
    const actualValue = received[property];
    const pass = actualValue === value;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have property "${property}" with value ${JSON.stringify(value)}`
          : `Expected element to have property "${property}" with value ${JSON.stringify(value)}, but got ${JSON.stringify(actualValue)}`,
    };
  }

  return {
    pass: true,
    message: () => `Expected element not to have property "${property}"`,
  };
}

/**
 * Check if element has text content
 */
function toHaveTextContent(received: HTMLElement, text: string): { pass: boolean; message: () => string } {
  const actualText = received.textContent || '';
  const pass = actualText.includes(text);

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have text content "${text}"`
        : `Expected element to have text content "${text}", but got "${actualText}"`,
  };
}

/**
 * Check if element's text content exactly matches (after trimming)
 */
function toEqualText(received: HTMLElement, expectedText: string): { pass: boolean; message: () => string } {
  const actualText = (received.textContent || '').trim();
  const trimmedExpected = expectedText.trim();
  const pass = actualText === trimmedExpected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element text not to equal "${trimmedExpected}"`
        : `Expected element text to equal "${trimmedExpected}", but got "${actualText}"`,
  };
}

/**
 * Check if element has shadow root
 */
function toHaveShadowRoot(received: HTMLElement): { pass: boolean; message: () => string } {
  const pass = !!received.shadowRoot;

  return {
    pass,
    message: () => (pass ? `Expected element not to have shadow root` : `Expected element to have shadow root`),
  };
}

/**
 * Parse HTML string to fragment
 */
function parseHtmlFragment(html: string): DocumentFragment {
  // Try mock-doc parser first
  try {
    const mockDoc = require('@stencil/core/mock-doc');
    if (mockDoc.parseHtmlToFragment) {
      return mockDoc.parseHtmlToFragment(html);
    }
  } catch {
    // Fall through to standard parser
  }

  // Use standard DOM parser (works in jsdom/happy-dom)
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Custom matcher to check if an element's HTML matches the expected HTML
 * Serializes the entire component tree including shadow DOM
 */
function toEqualHtml(
  received: string | HTMLElement | ShadowRoot,
  expected: string,
): { pass: boolean; message: () => string } {
  if (received == null) {
    throw new Error(`expect.toEqualHtml() received value is "${received}"`);
  }

  if (typeof (received as any).then === 'function') {
    throw new TypeError(`Element must be a resolved value, not a promise, before it can be tested`);
  }

  let receivedHtml: string;

  // Serialize the received value
  if (typeof received === 'string') {
    const fragment = parseHtmlFragment(received);
    // For string inputs, use innerHTML to avoid template wrapper
    receivedHtml = (fragment as any).innerHTML || fragment.textContent || '';
  } else if ((received as any).nodeType === 11) {
    // Document fragment
    receivedHtml = serializeHtml(received as any, { serializeShadowRoot: true });
  } else if ((received as any).nodeType === 1) {
    // Element node
    receivedHtml = serializeHtml(received as HTMLElement, { serializeShadowRoot: true });
  } else {
    throw new TypeError(`expect.toEqualHtml() value should be an element, shadow root, or string`);
  }

  // Parse and serialize expected HTML for consistent formatting
  // For expected HTML, just normalize whitespace without parsing through DOM
  // to preserve custom elements like <mock:shadow-root>
  let expectedHtml = normalizeHtml(expected.trim());
  receivedHtml = normalizeHtml(receivedHtml);

  const pass = receivedHtml === expectedHtml;

  return {
    pass,
    message: () =>
      pass
        ? `Expected HTML not to equal:\n${prettifyHtml(expectedHtml)}`
        : `Expected HTML to equal:\n${prettifyHtml(expectedHtml)}\n\nReceived:\n${prettifyHtml(receivedHtml)}`,
  };
} /**
 * Custom matcher to check if an element's Light DOM matches the expected HTML
 * Does not serialize shadow DOM
 */
function toEqualLightHtml(
  received: string | HTMLElement | ShadowRoot,
  expected: string,
): { pass: boolean; message: () => string } {
  if (received == null) {
    throw new Error(`expect.toEqualLightHtml() received value is "${received}"`);
  }

  if (typeof (received as any).then === 'function') {
    throw new TypeError(`Element must be a resolved value, not a promise, before it can be tested`);
  }

  let receivedHtml: string;

  // Serialize the received value (without shadow DOM)
  if (typeof received === 'string') {
    const fragment = parseHtmlFragment(received);
    // For string inputs, use innerHTML to avoid template wrapper
    receivedHtml = (fragment as any).innerHTML || fragment.textContent || '';
  } else if ((received as any).nodeType === 11) {
    // Document fragment
    receivedHtml = serializeHtml(received as any, { serializeShadowRoot: false });
  } else if ((received as any).nodeType === 1) {
    // Element node
    receivedHtml = serializeHtml(received as HTMLElement, { serializeShadowRoot: false });
  } else {
    throw new TypeError(`expect.toEqualLightHtml() value should be an element, shadow root, or string`);
  }

  // For expected HTML, just normalize whitespace without parsing through DOM
  // to preserve custom elements like <mock:shadow-root>
  let expectedHtml = normalizeHtml(expected.trim());
  receivedHtml = normalizeHtml(receivedHtml);

  const pass = receivedHtml === expectedHtml;

  return {
    pass,
    message: () =>
      pass
        ? `Expected Light DOM HTML not to equal:\n${prettifyHtml(expectedHtml)}`
        : `Expected Light DOM HTML to equal:\n${prettifyHtml(expectedHtml)}\n\nReceived:\n${prettifyHtml(receivedHtml)}`,
  };
}

/**
 * Check if an EventSpy has received at least one event
 */
function toHaveReceivedEvent(received: EventSpy): { pass: boolean; message: () => string } {
  const pass = received.length > 0;

  return {
    pass,
    message: () =>
      pass
        ? `Expected event "${received.eventName}" not to have been received`
        : `Expected event "${received.eventName}" to have been received, but it was not`,
  };
}

/**
 * Check if an EventSpy has received an event a specific number of times
 */
function toHaveReceivedEventTimes(received: EventSpy, count: number): { pass: boolean; message: () => string } {
  const pass = received.length === count;

  return {
    pass,
    message: () =>
      pass
        ? `Expected event "${received.eventName}" not to have been received ${count} times`
        : `Expected event "${received.eventName}" to have been received ${count} times, but it was received ${received.length} times`,
  };
}

/**
 * Safely stringify a value, handling circular references
 */
function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    // If circular reference, just return a string representation
    return String(value);
  }
}

/**
 * Safely compare two values, handling circular references
 */
function safeEquals(a: any, b: any): boolean {
  // Try JSON comparison first
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    // If circular reference, fall back to shallow comparison
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => a[key] === b[key]);
    }
    return a === b;
  }
}

/**
 * Check if the last received event has the expected detail
 */
function toHaveReceivedEventDetail(received: EventSpy, detail: any): { pass: boolean; message: () => string } {
  if (received.length === 0) {
    return {
      pass: false,
      message: () =>
        `Expected event "${received.eventName}" to have been received with detail, but no events were received`,
    };
  }

  const lastEvent = received.lastEvent!;
  const pass = safeEquals(lastEvent.detail, detail);

  return {
    pass,
    message: () =>
      pass
        ? `Expected last event detail not to equal ${safeStringify(detail)}`
        : `Expected last event detail to equal ${safeStringify(detail)}, but got ${safeStringify(lastEvent.detail)}`,
  };
}

/**
 * Check if the first received event has the expected detail
 */
function toHaveFirstReceivedEventDetail(received: EventSpy, detail: any): { pass: boolean; message: () => string } {
  if (received.length === 0) {
    return {
      pass: false,
      message: () =>
        `Expected event "${received.eventName}" to have been received with detail, but no events were received`,
    };
  }

  const firstEvent = received.firstEvent!;
  const pass = safeEquals(firstEvent.detail, detail);

  return {
    pass,
    message: () =>
      pass
        ? `Expected first event detail not to equal ${safeStringify(detail)}`
        : `Expected first event detail to equal ${safeStringify(detail)}, but got ${safeStringify(firstEvent.detail)}`,
  };
}

/**
 * Check if the last received event has the expected detail (alias for toHaveReceivedEventDetail)
 */
function toHaveLastReceivedEventDetail(received: EventSpy, detail: any): { pass: boolean; message: () => string } {
  return toHaveReceivedEventDetail(received, detail);
}

/**
 * Check if the event at a specific index has the expected detail
 */
function toHaveNthReceivedEventDetail(
  received: EventSpy,
  index: number,
  detail: any,
): { pass: boolean; message: () => string } {
  if (received.length === 0) {
    return {
      pass: false,
      message: () =>
        `Expected event "${received.eventName}" to have been received with detail, but no events were received`,
    };
  }

  if (index < 0 || index >= received.length) {
    return {
      pass: false,
      message: () => `Expected event at index ${index}, but only ${received.length} events were received`,
    };
  }

  const event = received.events[index];
  const pass = safeEquals(event.detail, detail);

  return {
    pass,
    message: () =>
      pass
        ? `Expected event at index ${index} detail not to equal ${safeStringify(detail)}`
        : `Expected event at index ${index} detail to equal ${safeStringify(detail)}, but got ${safeStringify(event.detail)}`,
  };
}

/**
 * Install custom matchers
 */
function installMatchers() {
  expect.extend({
    toHaveClass,
    toHaveClasses,
    toMatchClasses,
    toHaveAttribute,
    toEqualAttribute,
    toEqualAttributes,
    toHaveProperty,
    toHaveTextContent,
    toEqualText,
    toHaveShadowRoot,
    toEqualHtml,
    toEqualLightHtml,
    toHaveReceivedEvent,
    toHaveReceivedEventTimes,
    toHaveReceivedEventDetail,
    toHaveFirstReceivedEventDetail,
    toHaveLastReceivedEventDetail,
    toHaveNthReceivedEventDetail,
  });
}

// Auto-install matchers when this module is imported
installMatchers();

export {};
