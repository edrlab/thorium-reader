const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`MAIN nodeEnv: ${nodeEnv}`);

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

// let ignorePlugin = new webpack.IgnorePlugin({ resourceRegExp: new RegExp("/(bindings)/") })

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

////// ================================
////// EXTERNALS
// Some modules cannot be bundled by Webpack
// for example those that make internal use of NodeJS require() in special ways
// in order to resolve asset paths, etc.
// In DEBUG / DEV mode, we just external-ize as much as possible (any non-TypeScript / non-local code),
// to minimize bundle size / bundler computations / compile times.

let externals = {
    bindings: "bindings",
    yargs: "yargs",
    fsevents: "fsevents",
    conf: "conf",
    "electron-devtools-installer": "electron-devtools-installer",
    "remote-redux-devtools": "remote-redux-devtools",
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

    // if (process.env.WEBPACK === "bundle-external") {
    const nodeExternals = require("./nodeExternals");
    externals = [
        nodeExternals({
            processName: "MAIN",
            alias: aliases,
        }),
    ];
    // } else {
    //     const nodeExternals = require("webpack-node-externals");
    //     // electron-devtools-installer
    //     externals = [nodeExternals()];
    // }
}

console.log("WEBPACK externals (MAIN):");
console.log(JSON.stringify(externals, null, "  "));
////// EXTERNALS
////// ================================

let config = Object.assign(
    {},
    {
        bail: true,

        entry: "./src/main.ts",
        name: "main",
        mode: nodeEnv,
        output: {
            filename: "main.js",
            path: path.join(__dirname, "dist"),

            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2",
        },
        target: "electron-main",

        node: {
            __dirname: false,
            __filename: false,
        },

        externals: externals,

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
                // { test: /\.node$/, loaders: ["node-loader"] },
            ],
        },
        plugins: [
            new BundleAnalyzerPlugin({
                analyzerMode: "disabled",
                defaultSizes: "stat", // "parsed"
                openAnalyzer: false,
                generateStatsFile: true,
                statsFilename: "stats_main.json",
                statsOptions: null,

                excludeAssets: null,
            }),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(
                        __dirname,
                        "src",
                        "resources",
                        "information"
                    ),
                    to: "assets/md/information",
                },
            ]}),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(
                        __dirname,
                        "src",
                        "resources",
                        "lib",
                        "pdfjs",
                    ),
                    to: "assets/lib/pdfjs",
                },
            ]}),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(__dirname, "external-assets"),
                    to: "external-assets",
                },
            ]}),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(
                        __dirname,
                        "node_modules",
                        "r2-navigator-js",
                        "dist",
                        "ReadiumCSS"
                    ),
                    to: "ReadiumCSS",
                },
            ]}),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(__dirname, "node_modules", "mathjax"),
                    to: "MathJax",
                },
            ]}),
            new CopyWebpackPlugin({ patterns: [
                {
                    from: path.join(__dirname, "resources"),
                    to: "assets/icons",
                },
            ]}),
            preprocessorDirectives.definePlugin,
        ],
    }
);

config.plugins.push(
    new webpack.IgnorePlugin({ resourceRegExp: /^.\/runtime-fs$/ })
); // jsondown (runtimejs, fatfs)

config.plugins.push(
    new webpack.IgnorePlugin({ resourceRegExp: /^canvas$/ })
); // pdfjs

if (!checkTypeScriptSkip) {
    config.plugins.push(new ForkTsCheckerWebpackPlugin({
        // measureCompilationTime: true,
    }));
}

if (nodeEnv !== "production") {

    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    config.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";

    config.output.pathinfo = true;

    config.devtool = "source-map";
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
                    // node-fetch v2.x (fixed in 3.x https://github.com/node-fetch/node-fetch/pull/673 )
                    // keep_fnames: /AbortSignal/,
                },
            }),
        ],
    };
    // {
    //     minimize: false,
    // };

    config.plugins.push(
        new webpack.IgnorePlugin({
            resourceRegExp: /^electron-devtools-installer$/,
        })
    );
    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^remote-redux-devtools$/ })
    );
    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^json-diff$/ })
    );
}

module.exports = config;
