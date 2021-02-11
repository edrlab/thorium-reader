module.exports = {
    parser: "@typescript-eslint/parser",

    parserOptions: {
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
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended",
    ],
    plugins: ["prettier"],
    rules: {
        quotes: ["error", "double"],
        "comma-dangle": ["error", "always-multiline"],
        "eol-last": ["error", "always"],
        semi: ["error", "always"],

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

        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/explicit-module-boundary-types": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/no-empty-interface": 0,

        "prettier/prettier": "error",
    },
};
