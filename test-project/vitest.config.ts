import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        test: {
          name: 'stencil',
          environment: 'stencil',
          include: ['**/*.spec.{ts,tsx}'],
          exclude: [
            '**/*.jsdom.spec.{ts,tsx}',
            '**/*-jsdom.spec.{ts,tsx}',
            '**/*-happy.spec.{ts,tsx}',
            '**/*.happy.spec.{ts,tsx}',
          ],
          setupFiles: ['./vitest-setup-dist.ts'],
        },
      },
      {
        test: {
          name: 'custom-elements-output',
          environment: 'jsdom',
          include: ['**/*.spec.{ts,tsx}'],
          exclude: [
            '**/*.jsdom.spec.{ts,tsx}',
            '**/*-jsdom.spec.{ts,tsx}',
            '**/*-happy.spec.{ts,tsx}',
            '**/*.happy.spec.{ts,tsx}',
          ],
          setupFiles: ['./vitest-setup-ce.ts'],
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['**/*-jsdom.spec.{ts,tsx}', '**/*.jsdom.spec.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./vitest-setup-dist.ts'],
        },
      },
      {
        test: {
          name: 'happy-dom',
          include: ['**/*-happy.spec.{ts,tsx}', '**/*.happy.spec.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['./vitest-setup-dist.ts'],
        },
      },
      {
        // Node-only unit tests (no DOM environment)
        resolve: {
          alias: {
            '@utils': path.resolve(__dirname, 'src/utils'),
          },
        },
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/*.unit.ts'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['**/*.e2e.{ts,tsx}'],
          setupFiles: ['./vitest-setup-dist.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            expect: {
              toMatchScreenshot: {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                  threshold: 0.5,
                  allowedMismatchedPixels: 100,
                },
                resolveScreenshotPath: ({
                  arg,
                  browserName,
                  ext,
                  testFileName,
                  screenshotDirectory,
                  testFileDirectory,
                  root,
                }) => `${root}/${testFileDirectory}/${screenshotDirectory}/${testFileName}/${arg}-${browserName}${ext}`,
              },
            },
          },
        },
      },
    ],
  },
});
