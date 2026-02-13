import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',

      'test-project/dist/**',
      'test-project/loader/**',
      'test-project/.stencil/**',
      'test-project/www/**',
      'test-project/hydrate/**',
      'test-project/src/components.d.ts',

      'test-project-env-comments/dist/**',
      'test-project-env-comments/loader/**',
      'test-project-env-comments/.stencil/**',
      'test-project-env-comments/www/**',
      'test-project-env-comments/hydrate/**',
      'test-project-env-comments/src/components.d.ts',

      'packages/*/dist/**',
      'vitest-environment-stencil/**',
    ],
  },
];
