module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  env: {
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-typescript/base',
    'plugin:import/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    project: './tsconfig.json',
  },
  rules: {
    'no-restricted-syntax': 'off',
    semi: ['error', 'always'],
  },
};
