const { pathsToModuleNameMapper } = require('ts-jest');

// const { defaults: tsjPreset } = require('ts-jest/presets');
// const { jsWithTs: tsjPreset } = require('ts-jest/presets');
// const { jsWithBabel: tsjPreset } = require('ts-jest/presets');
// console.log(tsjPreset.transform);

const { compilerOptions } = require("./tsconfig");
// const fs = require("fs");
// const compilerOptions = JSON.parse(fs.readFileSync("./tsconfig.json", { encoding: "utf8" })).compilerOptions;

const pathMaps = pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" } );
// console.log(pathMaps);
const moduleNameMapper = {
    "readium-desktop/main/di": "<rootDir>/test/main/di.ts", // see src/common/utils.ts convertMultiLangStringToString()
    ...pathMaps,
    // ...{
    //     "^@r2\\-streamer\\-js/(.*)$": "<rootDir>/scripts/jest_void.ts",
    //     "^@r2\\-navigator\\-js/(.*)$": "<rootDir>/scripts/jest_void.ts",
    // },
};
// console.log(moduleNameMapper);

module.exports = {
    verbose: true,
    testEnvironment: "node",
    preset: "ts-jest",
    // globals: {
    // },
    transform: {
        "\\.ts$": "<rootDir>/scripts/jest_preprocessor.js",
        // ...tsjPreset.transform,
        "\\.tsx?$": ["ts-jest", {
            babelConfig: false,
            tsconfig: "<rootDir>/tsconfig.json",
        }],
    },
    moduleNameMapper,
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
    ],
    transformIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/resources/",
        "<rootDir>/changelogs/",
        "<rootDir>/docs/",
        "<rootDir>/img/",
        "<rootDir>/release/",
        "<rootDir>/scripts/",
    ],
    modulePathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/resources/",
        "<rootDir>/changelogs/",
        "<rootDir>/docs/",
        "<rootDir>/img/",
        "<rootDir>/release/",
        "<rootDir>/scripts/",
        "<rootDir>/src/",
    ],
    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/resources/",
        "<rootDir>/changelogs/",
        "<rootDir>/docs/",
        "<rootDir>/img/",
        "<rootDir>/release/",
        "<rootDir>/scripts/",
        "<rootDir>/src/",
    ],
    setupFilesAfterEnv: ['<rootDir>/scripts/jest_setup.js'],
    // runner: '@jest-runner/electron/main', // package.json dev dep: @jest-runner/electron
};
