module.exports = {
    ignorePatterns: [
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
        ".flox/*"
    ],
    // ignorePatterns: [ "*.*" ],
    parser: "@typescript-eslint/parser",
    env: {
        node: true,
        browser: true,
        es6: true,
        es2020: true,
    },
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    extends: [
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "prettier",
        "plugin:prettier/recommended",
    ],
    plugins: [
        // "unused-imports",
        "prettier",
        "eslint-plugin-local-rules",
        "react-hooks",
    ],
    rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "error",

        quotes: ["error", "double"],
        "comma-dangle": ["error", "always-multiline"],
        "eol-last": ["error", "always"],
        semi: ["error", "always"],

        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
        "@typescript-eslint/no-misused-promises": 0,
        "@typescript-eslint/require-await": 0,
        "@typescript-eslint/no-floating-promises": 0,
        "@typescript-eslint/unbound-method": 0,

        "@typescript-eslint/no-unsafe-enum-comparison": 0,
        "@typescript-eslint/restrict-plus-operands": 0,

        "no-unused-vars": 0,
        // "@typescript-eslint/no-unused-vars": 0,
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
        // "unused-imports/no-unused-imports": "error",
        // "unused-imports/no-unused-vars": [
        //     "error",
        //     {
        //         vars: "all",
        //         args: "all",
        //         argsIgnorePattern: "^_",
        //         varsIgnorePattern: "^_",
        //         caughtErrorsIgnorePattern: "^_",
        //         caughtErrors: "all",
        //     },
        // ],

        // react/jsx-uses-react
        // react/jsx-uses-vars

        // TODO?
        "react/prop-types": 0,

        // TODO! (deprecated and fobidden in strict mode)
        "react/no-find-dom-node": 0,

        // TODO ({} used as anonymous / generic object type)
        "@typescript-eslint/ban-types": 0,

        // TODO (many any!!)
        "@typescript-eslint/no-explicit-any": 0,

        // TODO (missing return types on functions)
        "@typescript-eslint/explicit-module-boundary-types": 0,
        // "@typescript-eslint/explicit-module-boundary-types": [
        //     "error",
        //     {
        //         allowArgumentsExplicitlyTypedAsAny: true,
        //         allowDirectConstAssertionInArrowFunctions: true,
        //         allowedNames: [],
        //         allowHigherOrderFunctions: true,
        //         allowTypedFunctionExpressions: true,
        //     },
        // ],

        // "@typescript-eslint/explicit-function-return-type": 0,
        // "@typescript-eslint/explicit-function-return-type": [
        //     "error",
        //     {
        //         allowExpressions: true,
        //         allowTypedFunctionExpressions: true,
        //     },
        // ],

        "prettier/prettier": "error",
    },
    overrides: [
        {
            files: ["./**/*.ts"],
            excludedFiles: ["./**/*.spec.ts"],
            rules: {
                "local-rules/typed-redux-saga-use-typed-effects": "error",
                "local-rules/typed-redux-saga-delegate-effects": "error",
            },
        },
    ],
    // overrides: [
    //     {
    //         files: ["*.ts", "*.tsx"],
    //         rules: {
    //             "@typescript-eslint/explicit-function-return-type": [
    //                 "error",
    //                 {
    //                     allowExpressions: true,
    //                 },
    //             ],
    //         },
    //     },
    // ],
};
