import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      perfectionist
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'alphabetical' }],
      'perfectionist/sort-jsx-props': ['error', { order: 'asc', type: 'alphabetical' }],
      'perfectionist/sort-object-types': ['error', { order: 'asc', type: 'alphabetical' }],
      'perfectionist/sort-objects': ['error', { order: 'asc', type: 'alphabetical' }]
    },
    languageOptions: {
      globals: globals.browser
    }
  },
  eslintConfigPrettier
])
