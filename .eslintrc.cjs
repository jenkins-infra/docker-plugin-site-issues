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
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      node: { extensions: [ ".js", ".mjs", ".ts" ] },
      "typescript": {
        "alwaysTryTypes": true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
      }
    }
  },
  rules: {
    'no-restricted-syntax': 'off',
    semi: ['error', 'always'],
    "import/extensions": [
      "error",
      "never",
      {
        "js": "always"
      }
    ]
  },
};
