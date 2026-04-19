import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'functions/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        React: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  }
];
