import { describe, it, expect } from 'vitest';

describe('no vitest-environment', () => {
  describe('should be able to use no // @vitest-environment', () => {
    it('should be no window', async () => {
      expect(() => window).toThrowError('window is not defined');
    });
  });
});
