import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'test/**/*.js', 'test/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        fetch: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
