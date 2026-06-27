import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const handlerGroup = {
  groupName: 'handler',
  elementNamePattern: '^on[A-Z]'
}

function generatePredefinedGroups(selectors, modifiers) {
  const groups = []

  for (let size = modifiers.length; size > 0; size -= 1) {
    groups.push(...getCombinations(modifiers, size).flatMap(getPermutations))
  }

  return selectors.flatMap((selector) => [
    ...groups.map((group) => [...group, selector].join('-')),
    selector
  ])
}

function getCombinations(items, size, start = 0, prefix = [], results = []) {
  if (prefix.length === size) {
    results.push(prefix)
    return results
  }

  for (let index = start; index < items.length; index += 1) {
    getCombinations(items, size, index + 1, [...prefix, items[index]], results)
  }

  return results
}

function getPermutations(items) {
  const results = []

  function permute(first) {
    if (first === items.length) {
      results.push([...items])
      return
    }

    for (let index = first; index < items.length; index += 1) {
      ;[items[first], items[index]] = [items[index], items[first]]
      permute(first + 1)
      ;[items[first], items[index]] = [items[index], items[first]]
    }
  }

  permute(0)
  return results
}

const jsxPropGroups = [...generatePredefinedGroups(['prop'], ['shorthand', 'multiline']), 'handler']
const objectTypeGroups = [
  ...generatePredefinedGroups(
    ['index-signature', 'member', 'method', 'property'],
    ['optional', 'required', 'multiline']
  ),
  'handler'
]
const objectGroups = ['member', 'method', 'property', 'handler']

export default defineConfig([
  globalIgnores(['dist']),
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      perfectionist
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      stylistic.configs.recommended
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
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@stylistic/multiline-comment-style': ['error', 'starred-block'],
      'perfectionist/sort-interfaces': [
        'error',
        {
          customGroups: [handlerGroup],
          groups: objectTypeGroups,
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-jsx-props': [
        'error',
        {
          customGroups: [handlerGroup],
          groups: jsxPropGroups,
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          customGroups: [handlerGroup],
          groups: objectTypeGroups,
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: [handlerGroup],
          groups: objectGroups,
          order: 'asc',
          type: 'alphabetical'
        }
      ]
    },
    languageOptions: {
      globals: globals.browser
    }
  }
])
