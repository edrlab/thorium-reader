
// npm run make-customization-profile -- --signed=true /tmp/test-profile /tmp


const path = require("path");
const webpack = require("webpack");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`MAIN nodeEnv: ${nodeEnv}`);

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es8-es2017/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es8-es2017/src",
    "@r2-opds-js": "r2-opds-js/dist/es8-es2017/src",
    "@r2-shared-js": "r2-shared-js/dist/es8-es2017/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es8-es2017/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es8-es2017/src",
    "@lunr-languages": "lunr-languages",
};

const useLegacyTypeScriptLoader = process.env.USE_LEGACY_TYPESCRIPT_LOADER ? true : false;
const checkTypeScriptSkip =
    nodeEnv !== "production" ? (process.env.SKIP_CHECK_TYPESCRIPT === "1" ? true : false) : false;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
ForkTsCheckerWebpackPlugin.prototype[require("util").inspect.custom] = (_depth, _options) => {
    return "ForkTsCheckerWebpackPlugin";
};

let config = Object.assign(
    {},
    {
        bail: true,

        entry: "./src/main/zip/create.ts",
        name: "main",
        mode: nodeEnv,
        output: {
            filename: "make-package.js",
            path: path.join(__dirname, "dist"),

            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2", // commonjs-module
        },
        // target: "electron-main",

        node: {
            __dirname: false,
            __filename: false,
        },

        externalsPresets: { node: true },
        externals: {},
        externalsType: "commonjs", // module, node-commonjs
        experiments: {
            outputModule: false, // module, node-commonjs
        },

        resolve: {
            // Add '.ts' as resolvable extensions.
            extensions: [".ts", ".js", ".node"],
            alias: aliases,
        },
        stats: {
            // all: true,
            // warningsFilter: /export .* was not found in/,
            // warningsFilter: /was not found in 'typed-redux-saga\/macro'/,
        },
        module: {
            rules: [
                // {
                //     test: /\.tsx$/,
                //     loader: useLegacyTypeScriptLoader ? "awesome-typescript-loader" : "ts-loader",
                //     options: {
                //         transpileOnly: true, // checkTypeScriptSkip
                //         // compiler: "@typescript/native-preview",
                //     },
                // },
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: [],
                                // sourceMaps: "inline",
                                plugins: ["macros"],
                            },
                        },
                        {
                            loader: useLegacyTypeScriptLoader ? "awesome-typescript-loader" : "ts-loader",
                            options: {
                                transpileOnly: true, // checkTypeScriptSkip
                                // compiler: "@typescript/native-preview",
                            },
                        },
                    ],
                },
                // { test: /\.node$/, loader: "node-loader" },
                {
                    test: /\.(js|ts)$/,
                    use: [
                        {
                            loader: path.resolve("./scripts/webpack-loader-scope-checker.js"),
                            options: {
                                forbids: "src/renderer",
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            preprocessorDirectives.definePlugin,
        ],
    },
);

if (checkTypeScriptSkip) {
    // const GoTsCheckerWebpackPlugin = require("./scripts/go-ts-checker-webpack-plugin");
    // config.plugins.push(
    //     new GoTsCheckerWebpackPlugin({name: "MAIN"}),
    // );
} else {
    config.plugins.push(
        new ForkTsCheckerWebpackPlugin({
            // measureCompilationTime: true,
        }),
    );
}

if (process.env.ENABLE_WEBPACK_BUNDLE_STATS)
config.plugins.push(
new StatoscopeWebpackPlugin({
  saveReportTo: './dist/STATOSCOPE_[name].html',
  // saveStatsTo: './dist/STATOSCOPE_[name].json',
  saveStatsTo: undefined,
  normalizeStats: false,
  saveOnlyStats: false,
  disableReportCompression: true,
  statsOptions: {},
  additionalStats: [],
  watchMode: false,
  name: 'main',
  open: false,
  compressor: false,
}),
new BundleAnalyzerPlugin({
    analyzerMode: "disabled",
    defaultSizes: "stat", // "parsed"
    openAnalyzer: false,
    generateStatsFile: true,
    statsFilename: "stats_main.json",
    statsOptions: null,
    excludeAssets: null,
}));

module.exports = config;
