import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import solidPlugin from 'eslint-plugin-solid';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      'solid': solidPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      
      // Solid specific rules
      'solid/reactivity': 'warn',
      'solid/no-destructure': 'warn',
      'solid/jsx-no-undef': 'error',
      
      // General rules
      'no-console': 'warn',
      'prefer-const': 'warn',
    },
  },
];
