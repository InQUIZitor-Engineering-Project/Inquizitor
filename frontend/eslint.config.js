import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'max-len': ['warn', { code: 110, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': 'warn',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: 'Avoid inline styles; use tokens/primitives instead.',
        },
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]',
          message: 'Avoid raw hex colors; use theme tokens.',
        },
      ],
    },
  },
)
