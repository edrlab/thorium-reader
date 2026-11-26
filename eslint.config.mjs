import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import tsParser from "@typescript-eslint/parser";
// import { fixupPluginRules } from "@eslint/compat";

import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import localRules from "eslint-plugin-local-rules";
import oxlint from "eslint-plugin-oxlint";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENABLE_PRETTIER = false; // see .prettierignore and .prettierrc.js

// const compat = new FlatCompat({
//   baseDirectory: import.meta.dirname || __dirname,
//   // recommendedConfig: js.configs.recommended,
//   // allConfig: js.configs.all,
// });

// const def1 = await oxlint.buildFromConfigFile("./oxlint.config.mjs");
// console.log(JSON.stringify(def1, null, 4));
//
// const def2 = oxlint.configs["flat/recommended"];
// console.log(JSON.stringify(def2, null, 4));

export default defineConfig([
  {
    languageOptions: {
      parser: tseslint.parser, // tsParser,

      globals: {
        ...globals.node,
        ...globals.browser,
      },

      ecmaVersion: 2020,
      sourceType: "module",

      parserOptions: {
        project: true,
        // projectService: true,
        tsconfigRootDir: import.meta.dirname || __dirname,

        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    extends: [
      //compat.extends()
      //"plugin:react/recommended",
      // "plugin:@typescript-eslint/recommended-type-checked",
      // "prettier", // see eslintPluginPrettierRecommended
      // "plugin:prettier/recommended", // see eslintPluginPrettierRecommended
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
    ],

    plugins: {
      // prettier, // see eslintPluginPrettierRecommended
      "local-rules": localRules,
      // "react-hooks": fixupPluginRules(reactHooks),
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // "@typescript-eslint/no-useless-default-assignment": "off",
      "@eslint-react/naming-convention-context-name": 0,
      "@eslint-react/no-set-state-in-component-did-update": 0,
      "@eslint-react/use-state": 0,
      "@eslint-react/naming-convention-ref-name": 0,
      "no-useless-catch": 0,
      "preserve-caught-error": 0,
      "no-control-regex": 0,
      "no-fallthrough": 0,
      "@eslint-react/no-unnecessary-use-prefix": 0,
      "@eslint-react/no-children-only": 0,
      "@eslint-react/no-clone-element": 0,
      "@eslint-react/web-api-no-leaked-fetch": 0,
      "@eslint-react/dom-no-dangerously-set-innerhtml": 0,
      "no-sparse-arrays": 0,
      "no-useless-assignment": 0,
      "no-constant-condition": 0,
      "no-cond-assign": 0,
      "no-unexpected-multiline": 0,
      "require-yield": 0,
      "no-case-declarations": 0,
      "no-extra-boolean-cast": 0,
      "no-empty": 0,
      "@eslint-react/no-nested-component-definitions": 0,
      "@eslint-react/static-components": 0,
      "@eslint-react/set-state-in-effect": 0,
      "@eslint-react/no-access-state-in-setstate": 0,
      "@eslint-react/no-unused-class-component-members": 0,
      "@eslint-react/web-api-no-leaked-timeout": 0,
      "@eslint-react/no-array-index-key": 0,
      "no-unassigned-vars": 0,
      "no-self-assign": 0,
      "no-misleading-character-class": 0,
      "no-constant-binary-expression": 0,
      "no-useless-escape": 0,
      "@eslint-react/use-memo": 0,
      "no-irregular-whitespace": 0,
      "@eslint-react/error-boundaries": 0,
      "no-prototype-builtins": 0,
      "@eslint-react/no-children-for-each": 0,
      "@eslint-react/no-missing-key": "error",
      "@eslint-react/rules-of-hooks": "error",
      "@eslint-react/exhaustive-deps": "error",
      quotes: ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
      semi: ["error", "always"],
      "@typescript-eslint/no-empty-object-type": 0,
      "@typescript-eslint/prefer-promise-reject-errors": 0,
      "@typescript-eslint/only-throw-error": 0,
      "@typescript-eslint/no-unsafe-member-access": 0,
      "@typescript-eslint/no-unsafe-return": 0,
      "@typescript-eslint/no-unsafe-assignment": 0,
      "@typescript-eslint/no-unsafe-call": 0,
      "@typescript-eslint/no-unsafe-argument": 0,
      "@typescript-eslint/no-unnecessary-type-assertion": 0,
      "@typescript-eslint/restrict-template-expressions": 0,
      "@typescript-eslint/no-redundant-type-constituents": 0,
      "@typescript-eslint/no-base-to-string": 0,
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": 0,
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/unbound-method": 0,
      "@typescript-eslint/no-unsafe-enum-comparison": 0,
      "@typescript-eslint/restrict-plus-operands": 0,
      "no-unused-vars": 0,

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          caughtErrors: "all",
        },
      ],

      "react/prop-types": 0,
      "react/no-find-dom-node": 0,
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/explicit-module-boundary-types": 0,
      ...(ENABLE_PRETTIER
        ? {
            "prettier/prettier": "error",
          }
        : {}),
    },
  },
  globalIgnores([
    "src/r2-xxx-js/r2-navigator-js/electron/common/colibrio-cfi/*",
    ".vscode/*",
    ".history/*",
    ".github/*",
    ".git/*",
    "dist/*",
    "docs/*",
    "img/*",
    "node_modules/*",
    "resources/*",
    "external-assets/*",
    "scripts/*",
    "src/typings/*",
    "src/resources/*",
    "src/renderer/assets/*",
    "src/renderer/reader/pdf/*",
    ".zed/*",
    ".flox/*",
    ".pi/*",
    // "test/*",
    ".github_release/*",
    "**/webpack.config.*",
    "**/package.json",
    "src/package.json",
    "**/package-lock.json",
    "native-node-addon-windows-registry/*",
  ]),
  {
    files: ["./**/*.ts"],
    ignores: ["./**/*.spec.ts"],

    rules: {
      "local-rules/typed-redux-saga-use-typed-effects": "error",
      "local-rules/typed-redux-saga-delegate-effects": "error",
    },
  },
  ...(ENABLE_PRETTIER ? eslintPluginPrettierRecommended : []),
  ...oxlint.configs["flat/recommended"],
  ...(await oxlint.buildFromConfigFile("./oxlint.config.mjs")),
]);
