"use strict"

module.exports = {
  root: true,
  extends: [
    "plugin:vue/recommended",
    "eslint:recommended",
    "plugin:prettier/recommended",
    "prettier/vue"
  ],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: "module",
    parser: "babel-eslint"
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  plugins: ["vue", "prettier"],
  rules: {
    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
    "no-undef": "error",
    "no-unused-vars": "error",
    quotes: ["error", "backtick"],
    "no-var": "error",
    "prettier/prettier": "error",
    "no-multiple-empty-lines": ["error", { max: 1 }],
    "prefer-const": [
      "error",
      {
        destructuring: "all",
        ignoreReadBeforeAssign: false
      }
    ],
    "vue/max-attributes-per-line": [
      "error",
      {
        singleline: 3,
        multiline: {
          max: 1,
          allowFirstLine: false
        }
      }
    ],
    "vue/html-closing-bracket-newline": [
      "error",
      {
        singleline: "never",
        multiline: "always"
      }
    ],
    "vue/multiline-html-element-content-newline": [
      "error",
      {
        ignores: ["pre", "textarea"]
      }
    ],

    // To be discussed
    "no-empty-pattern": "off",
    "no-useless-escape": "off",
    "no-console": "off"
  }
}
