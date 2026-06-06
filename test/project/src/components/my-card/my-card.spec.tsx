/**
 * Component tests for my-card using @stencil/vitest
 */
import { describe, it, expect } from 'vitest';
import { render, type RenderResult } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('my-card - spec tests', () => {
  let result: RenderResult;

  describe('rendering', () => {
    it('should render with default props', async () => {
      result = await render(
        <my-card>
          <p>Card content</p>
        </my-card>,
      );

      expect(result.root).toBeTruthy();
      expect(result.root.tagName.toLowerCase()).toBe('my-card');
    });

    it('should render title when provided', async () => {
      result = await render(
        <my-card cardTitle="Test Card">
          <p>Content</p>
        </my-card>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const title = shadowRoot!.querySelector('.card__title');

      expect(title?.textContent).toBe('Test Card');
    });

    it('should render without header when title is not provided', async () => {
      result = await render(
        <my-card>
          <p>Content</p>
        </my-card>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const header = shadowRoot!.querySelector('.card__header');

      // Header should not be rendered when no cardTitle
      expect(header).toBeNull();
    });

    it('should render default slot content', async () => {
      result = await render(
        <my-card>
          <p>This is card content</p>
        </my-card>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const content = shadowRoot!.querySelector('.card__content');

      expect(content).toBeTruthy();
    });
  });

  describe('elevation', () => {
    it('should apply elevation-1 class by default', async () => {
      result = await render(<my-card />);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--elevation-1')).toBe(true);
    });

    it('should apply custom elevation class', async () => {
      result = await render(<my-card elevation={3} />);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--elevation-3')).toBe(true);
    });

    it('should support elevation 0', async () => {
      result = await render(<my-card elevation={0} />);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--elevation-0')).toBe(true);
    });
  });

  describe('interactive', () => {
    it('should not be interactive by default', async () => {
      result = await render(<my-card />);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--interactive')).toBe(false);
    });

    it('should apply interactive class when enabled', async () => {
      result = await render(<my-card interactive />);

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--interactive')).toBe(true);
    });
  });

  describe('slots', () => {
    it('should render footer slot when provided', async () => {
      result = await render(
        <my-card cardTitle="Card">
          <p>Content</p>
          <div slot="footer">Footer content</div>
        </my-card>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const footer = shadowRoot!.querySelector('.card__footer');

      expect(footer).toBeTruthy();
    });

    it('should render header-actions slot', async () => {
      result = await render(
        <my-card cardTitle="Card">
          <button slot="header-actions">Action</button>
          <p>Content</p>
        </my-card>,
      );

      await result.waitForChanges();
      const shadowRoot = result.root.shadowRoot;
      const header = shadowRoot!.querySelector('.card__header');

      expect(header).toBeTruthy();
    });
  });

  describe('props updates', () => {
    it('should update title', async () => {
      result = await render(<my-card cardTitle="Initial" />);

      await result.setProps({ cardTitle: 'Updated' });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const title = shadowRoot!.querySelector('.card__title');

      expect(title?.textContent).toBe('Updated');
    });

    it('should update elevation', async () => {
      result = await render(<my-card elevation={1} />);

      await result.setProps({ elevation: 2 });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--elevation-2')).toBe(true);
      expect(card?.classList.contains('card--elevation-1')).toBe(false);
    });

    it('should toggle interactive state', async () => {
      result = await render(<my-card interactive={false} />);

      await result.setProps({ interactive: true });
      await result.waitForChanges();

      const shadowRoot = result.root.shadowRoot;
      const card = shadowRoot!.querySelector('.card');

      expect(card?.classList.contains('card--interactive')).toBe(true);
    });
  });
});
