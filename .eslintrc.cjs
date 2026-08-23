// Root ESLint config for api + shared workspaces (TypeScript only).
// apps/web has its own .eslintrc.json that extends next/core-web-vitals.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // must be last — disables style rules that conflict with prettier
  ],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['dist', '.next', 'build', 'node_modules', 'coverage'],
  rules: {
    // @typescript-eslint/no-explicit-any is warn in recommended; keep as warn for now
    // since the codebase has widespread any usage that will be cleaned up in Phase 5
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow intentionally unused variables prefixed with _ (standard JS/TS convention)
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
  },
};
