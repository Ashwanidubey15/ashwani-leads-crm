import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    // rules: {
    //   '@typescript-eslint/no-explicit-any': 'warn',
    //   '@typescript-eslint/no-unused-vars': 'warn',
    //   '@typescript-eslint/no-unused-expressions': 'warn',
    //   '@typescript-eslint/no-this-alias': 'warn',
    //   '@typescript-eslint/no-require-imports': 'warn',
    // },
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/generated/**',
      '**/*.generated.*',
      '**/prisma/generated/**',
    ],
  },
];

export default eslintConfig;
