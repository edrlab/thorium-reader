const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es6-es2015/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es6-es2015/src",
    "@r2-opds-js": "r2-opds-js/dist/es6-es2015/src",
    "@r2-shared-js": "r2-shared-js/dist/es6-es2015/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es6-es2015/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es6-es2015/src",
};

////// ================================
////// EXTERNALS
// Some modules cannot be bundled by Webpack
// for example those that make internal use of NodeJS require() in special ways
// in order to resolve asset paths, etc.
// In DEBUG / DEV mode, we just external-ize as much as possible (any non-TypeScript / non-local code),
// to minimize bundle size / bundler computations / compile times.

// const nodeExternals = require("webpack-node-externals");
const nodeExternals = require("./nodeExternals");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`PDF nodeEnv: ${nodeEnv}`);

// https://github.com/edrlab/thorium-reader/issues/1097#issuecomment-643406149
const useLegacyTypeScriptLoader = process.env.USE_LEGACY_TYPESCRIPT_LOADER
    ? true
    : false;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
ForkTsCheckerWebpackPlugin.prototype[require("util").inspect.custom] = (_depth, _options) => { return "ForkTsCheckerWebpackPlugin" };
const checkTypeScriptSkip =
    nodeEnv !== "production" ?
    (process.env.SKIP_CHECK_TYPESCRIPT === "1" ? true : false)
    : false
    ;

let externals = {
    bindings: "bindings",
    fsevents: "fsevents",
    conf: "conf",
};
if (nodeEnv !== "production") {
    // // externals = Object.assign(externals, {
    // //         "electron-config": "electron-config",
    // //     }
    // // );
    // const { dependencies } = require("./package.json");
    // const depsKeysArray = Object.keys(dependencies || {});
    // const depsKeysObj = {};
    // depsKeysArray.forEach((depsKey) => { depsKeysObj[depsKey] = depsKey });
    // externals = Object.assign(externals, depsKeysObj);

    if (process.env.WEBPACK === "bundle-external") {
        externals = [
            nodeExternals({
                processName: "PDF",
                alias: aliases,
            }),
        ];
    } else {
        externals.devtron = "devtron";
    }
}

console.log("WEBPACK externals (PDF):");
console.log(JSON.stringify(externals, null, "  "));
////// EXTERNALS
////// ================================

let config = Object.assign(
    {},
    {
        entry: "./src/renderer/reader/pdf/webview/index_pdf.ts",
        name: "renderer pdf webview index",
        output: {
            filename: "index_pdf.js",
            path: path.join(__dirname, "dist"),
            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2",
        },
        target: "electron-renderer",

        mode: "production", // nodeEnv,

        externals: externals,

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            alias: aliases,
        },
        stats: {
            // warningsFilter: /export .* was not found in/,
        },
        module: {
            rules: [
                {
                    test: /\.(jsx?|tsx?)$/,
                    use: [
                        {
                            loader: path.resolve(
                                "./scripts/webpack-loader-scope-checker.js"
                            ),
                            options: {
                                forbid: "library",
                            },
                        },
                    ],
                },
                {
                    test: /\.tsx$/,
                    loader: useLegacyTypeScriptLoader
                        ? "awesome-typescript-loader"
                        : "ts-loader",
                    options: {
                        transpileOnly: true, // checkTypeScriptSkip
                    },
                },
                {
                    test: /\.ts$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: [],
                                plugins: ["macros"],
                            },
                        },
                        {
                            loader: useLegacyTypeScriptLoader
                                ? "awesome-typescript-loader"
                                : "ts-loader",
                            options: {
                                transpileOnly: true, // checkTypeScriptSkip
                            },
                        },
                    ],
                },
            ],
        },

        plugins: [
            new BundleAnalyzerPlugin({
                analyzerMode: "disabled",
                defaultSizes: "stat", // "parsed"
                openAnalyzer: false,
                generateStatsFile: true,
                statsFilename: "stats_renderer-pdf.json",
                statsOptions: null,

                excludeAssets: null,
            }),
            preprocessorDirectives.definePlugin,
        ],
    }
);

if (!checkTypeScriptSkip) {
    config.plugins.push(new ForkTsCheckerWebpackPlugin({
        // measureCompilationTime: true,
    }));
}

if (nodeEnv !== "production") {
} else {

    config.optimization =
    {
        ...(config.optimization || {}),
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                exclude: /MathJax/,
                terserOptions: {
                    compress: false,
                    mangle: false,
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    };
    // {
    //     minimize: false,
    // };

    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^devtron$/ })
    );
    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^react-axe$/ })
    );
}

module.exports = config;
