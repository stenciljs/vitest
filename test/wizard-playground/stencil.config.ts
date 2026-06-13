import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'Test',
  outputTargets: [
    { type: 'standalone' },
    { type: 'docs-custom-elements-manifest', file: 'custom-elements.json' },
    { type: 'docs-json', file: 'docs/api.json' },
    { type: 'docs-vscode', file: 'vscode-data.json' },
  ],
  signalBacking: true,
};
