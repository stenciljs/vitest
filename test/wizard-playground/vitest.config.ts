import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        plugins: [stencilVitestPlugin()],
        test: {
          name: 'unit',
          environment: 'stencil',
          environmentOptions: {
            stencil: { domEnvironment: 'jsdom' },
          },
          include: ['**/*.spec.{ts,tsx}'],
          exclude: ['**/*.browser.spec.{ts,tsx}', '**/*.happy.spec.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['**/*.browser.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'happy',
          environment: 'stencil',
          environmentOptions: {
            stencil: { domEnvironment: 'happy-dom' },
          },
          setupFiles: ['./vitest-setup.ts'],
          include: ['**/*.happy.spec.{ts,tsx}'],
        },
      },
    ],
  },
});
