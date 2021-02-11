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

        // TODO?
        "react/prop-types": 0,

        // TODO! (deprecated and fobidden in strict mode)
        "react/no-find-dom-node": 0,

        // TODO ({} used as anonymous / generic object type)
        "@typescript-eslint/ban-types": 0,

        // TODO (any!!)
        "@typescript-eslint/no-explicit-any": 0,

        "@typescript-eslint/explicit-module-boundary-types": 0,

        "prettier/prettier": "error",
    },
};
