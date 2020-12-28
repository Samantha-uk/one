require("@rushstack/eslint-patch/modern-module-resolution");
module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    serviceworker: true
  },
  extends: [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
//    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:eslint-comments/recommended",
    "plugin:promise/recommended",
    "plugin:wc/recommended",
    "plugin:lit/recommended",
    "plugin:unicorn/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      modules: true
    },
    ecmaVersion: 2020,
    project: [
      "./tsconfig.eslint.json"
    ],
    sourceType: "module"
  },
  plugins: [
    "@typescript-eslint",
    "eslint-comments",
    "import",
    "lit",
    "prettier",
    "promise",
    "unicorn"
  ],
  root: true,
  rules: {
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        "format": [
          "camelCase",
          "PascalCase",
          "UPPER_CASE"
        ],
        "leadingUnderscore": "allow",
        "selector": "variable"
      },
      {
        "format": [
          "camelCase",
          "PascalCase"
        ],
        "leadingUnderscore": "allow",
        "selector": "function"
      },
      {
        "format": [
          "PascalCase"
        ],
        "selector": "typeLike"
      }
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/restrict-template-expressions": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "ts": "never",
        "jsx": "never",
        "tsx": "never"
      }
    ],
    "import/prefer-default-export": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "no-restricted-syntax": [
      "error",
      "LabeledStatement",
      "WithStatement"
    ],
    "no-return-assign": [
      "error",
      "except-parens"
    ],
    "no-underscore-dangle": "off",
    "prettier/prettier": "error",
    "quotes": [
      "warn",
      "backtick"
    ],
    "unicorn/no-nested-ternary": "off",
    "unicorn/no-useless-undefined": "off",
    "unicorn/number-literal-case": "off"
  },
  "settings": {
    "import/extensions": [
      ".js",
      ".jsx",
      ".ts",
      ".tsx"
    ],
    "import/parsers": {
      "@typescript-eslint/parser": [
        ".ts",
        ".tsx"
      ]
    },
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ]
      }
    }
  }
};