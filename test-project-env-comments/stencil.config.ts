import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'test-components-env-comments',
  suppressReservedPublicNameWarnings: true,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
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
