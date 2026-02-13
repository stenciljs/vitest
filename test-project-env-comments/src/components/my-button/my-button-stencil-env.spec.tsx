// @vitest-environment stencil

import { describe, it, expect } from 'vitest';
import { render, type RenderResult } from '@stencil/vitest';
import { h } from '@stencil/core';

describe('@vitest-environment stencil', () => {
  let result: RenderResult;

  describe('should be able to use // @vitest-environment stencil', () => {
    it('should render with default props', async () => {
      result = await render(<my-button>Click me</my-button>);

      expect(result.root).toBeTruthy();
      expect(result.root.tagName.toLowerCase()).toBe('my-button');
    });
  });
});
