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
        // "@typescript-eslint/explicit-function-return-type": "off"
        "quotes": ["error", "double"],
        "comma-dangle": ["error", "always-multiline"],
        "eol-last": ["error", "always"],
        "semi": ["error", "always"],
        "no-unused-vars": ["error", {
            "vars": "all",
            "args": "all",
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_",
            "caughtErrors": "all" }
        ],
        "prettier/prettier": "error",
    },
};
