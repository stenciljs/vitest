import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'test-components',
  suppressReservedPublicNameWarnings: true,
  buildDist: true,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      autoLoader: true,
    },
    {
      type: 'dist-hydrate-script',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  testing: {
    browserHeadless: true,
  },
  extras: {
    experimentalSlotFixes: true,
  },
};
