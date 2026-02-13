import type { EnvironmentStencil } from '../types.js';
import { applyMockDocPolyfills } from '../../setup/mock-doc-setup.js';

export default <EnvironmentStencil>async function (_global, _options) {
  const mockDoc = await import('@stencil/core/mock-doc');
  const win = new mockDoc.MockWindow('http://localhost:3000/');
  applyMockDocPolyfills(win as any);

  return {
    window: win as any,
    teardown() {
      if (typeof mockDoc.teardownGlobal === 'function') {
        mockDoc.teardownGlobal(win as any);
      }
    },
  };
};
