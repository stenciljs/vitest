/**
 * Tests demonstrating event spy functionality
 */
import { describe, it, expect } from 'vitest';
import { render } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-button - event spy', () => {
  describe('toHaveReceivedEvent', () => {
    it('should detect when an event has been received', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      // Click the shadow button
      const button = root.shadowRoot?.querySelector('button');
      button?.click();

      expect(spy).toHaveReceivedEvent();
    });

    it('should fail when no events have been received', async () => {
      const { spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');

      // Don't click - no events should be received
      expect(() => {
        expect(spy).toHaveReceivedEvent();
      }).toThrow();
    });
  });

  describe('toHaveReceivedEventTimes', () => {
    it('should count the number of events received', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      // Click multiple times
      button?.click();
      button?.click();
      button?.click();

      expect(spy).toHaveReceivedEventTimes(3);
    });

    it('should fail when event count does not match', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      button?.click();
      button?.click();

      expect(() => {
        expect(spy).toHaveReceivedEventTimes(5);
      }).toThrow();
    });
  });

  describe('toHaveReceivedEventDetail', () => {
    it('should check the last event detail', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      button?.click();

      // The button emits a MouseEvent - verify it's defined
      expect(spy.lastEvent.detail).toBeDefined();
    });
  });

  describe('toHaveFirstReceivedEventDetail', () => {
    it('should check the first event detail', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      // Click multiple times
      button?.click();
      button?.click();
      button?.click();

      // Verify the first event detail is defined
      expect(spy.firstEvent.detail).toBeDefined();
      expect(spy.events).toHaveLength(3);
    });
  });

  describe('toHaveLastReceivedEventDetail', () => {
    it('should check the last event detail', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      // Click multiple times
      button?.click();
      button?.click();
      button?.click();

      // Verify the last event detail is defined
      expect(spy.lastEvent.detail).toBeDefined();
      expect(spy.events).toHaveLength(3);
    });
  });

  describe('toHaveNthReceivedEventDetail', () => {
    it('should check a specific event detail by index', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      // Click multiple times
      button?.click(); // index 0
      button?.click(); // index 1
      button?.click(); // index 2

      // Verify the second event (index 1) detail is defined
      expect(spy.events[1].detail).toBeDefined();
    });

    it('should fail when index is out of bounds', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      button?.click();

      expect(() => {
        expect(spy).toHaveNthReceivedEventDetail(5, {});
      }).toThrow();
    });
  });

  describe('combined usage', () => {
    it('should allow testing complex event scenarios', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const spy = spyOnEvent('buttonClick');
      const button = root.shadowRoot?.querySelector('button');

      // Trigger multiple clicks
      button?.click();
      button?.click();
      button?.click();

      // Verify event counts
      expect(spy).toHaveReceivedEvent();
      expect(spy).toHaveReceivedEventTimes(3);

      // Verify all events are captured
      expect(spy.events).toHaveLength(3);
      expect(spy.firstEvent).toBeDefined();
      expect(spy.lastEvent).toBeDefined();

      // Verify all events have mouse event details
      spy.events.forEach((event) => {
        expect(event.detail).toBeDefined();
      });
    });
  });

  describe('multiple event spies', () => {
    it('should handle multiple event spies independently', async () => {
      const { root, spyOnEvent } = await render(<my-button>Click me</my-button>);
      const clickSpy = spyOnEvent('buttonClick');
      const customSpy = spyOnEvent('customEvent');
      const button = root.shadowRoot?.querySelector('button');

      // Only click event should be fired
      button?.click();

      expect(clickSpy).toHaveReceivedEvent();
      expect(clickSpy).toHaveReceivedEventTimes(1);

      // Custom event should not have been received
      expect(() => {
        expect(customSpy).toHaveReceivedEvent();
      }).toThrow();
    });
  });
});
