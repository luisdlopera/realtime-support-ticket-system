import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs["eslint-recommended"].rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-unused-vars": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/test/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "prisma/generated/**"],
  },
];
