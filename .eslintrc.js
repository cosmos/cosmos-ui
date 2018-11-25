"use strict"

module.exports = {
  root: true,
  extends: ["plugin:vue/recommended", "prettier", "prettier/vue"],
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
    "prettier/prettier": "error"
  }
}
