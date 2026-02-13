import type { EnvironmentStencil } from '../types.js';
import { applyMockDocPolyfills } from '../../setup/mock-doc-setup.js';

export default <EnvironmentStencil>async function (_global, _options) {
  // Try new package first, fall back to old for backward compatibility
  let mockDoc;
  try {
    // @ts-ignore - this package may not exist in older versions of Stencil
    mockDoc = await import('@stencil/mock-doc');
  } catch {
    // @ts-ignore - this package may not exist in newer versions of Stencil
    mockDoc = await import('@stencil/core/mock-doc');
  }
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
