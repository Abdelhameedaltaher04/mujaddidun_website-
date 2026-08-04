// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'lib/api-client-react/src/generated/**',
      'lib/api-zod/src/generated/**',
      '.local/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // Frontend (React) packages
    files: [
      'artifacts/web/**/*.{ts,tsx}',
      'artifacts/mockup-sandbox/**/*.{ts,tsx}',
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Backend (Node) packages
    files: [
      'artifacts/api-server/**/*.{ts,mjs}',
      'lib/**/*.ts',
      'scripts/**/*.ts',
      '**/*.config.{js,ts,mjs}',
      '**/vite.config.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Server code must use the pino logger, never console
    files: ['artifacts/api-server/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    // Vendored scaffold files (shadcn/ui primitives and their hooks) are
    // third-party code — keep them lint-clean without modifying them.
    // This block is last so it wins over the generic rules above.
    files: [
      '**/src/components/ui/**',
      '**/src/hooks/use-mobile.tsx',
      '**/src/hooks/use-toast.ts',
      'artifacts/mockup-sandbox/src/App.tsx',
      'artifacts/api-server/build.mjs',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/incompatible-library': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
