import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Security rules
      "no-eval": "error",
      "no-new-func": "error",
      "no-implied-eval": "error",

      // Code quality (SOLID principles enforcement)
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", 20],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "coverage/**", "*.config.*"],
  },
];

export default eslintConfig;
