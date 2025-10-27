const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`MAIN nodeEnv: ${nodeEnv}`);

// https://github.com/edrlab/thorium-reader/issues/1097#issuecomment-643406149
const useLegacyTypeScriptLoader = process.env.USE_LEGACY_TYPESCRIPT_LOADER ? true : false;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
ForkTsCheckerWebpackPlugin.prototype[require("util").inspect.custom] = (_depth, _options) => {
    return "ForkTsCheckerWebpackPlugin";
};
const checkTypeScriptSkip =
    nodeEnv !== "production" ? (process.env.SKIP_CHECK_TYPESCRIPT === "1" ? true : false) : false;
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

let externals = {
    bindings: "bindings",
    fsevents: "fsevents",
    "electron-devtools-installer": "electron-devtools-installer",
    "remote-redux-devtools": "remote-redux-devtools",
    electron: "electron",
    // yargs: "yargs",
};
const _externalsCache = new Set();
if (nodeEnv !== "production") {
    const nodeExternals = require("webpack-node-externals");
    const neFunc = nodeExternals({
        allowlist: ["marked", "pdf.js", "readium-speech", "@github/paste-markdown", "yargs", "timeout-signal", "nanoid", "normalize-url", "node-fetch", "data-uri-to-buffer", /^fetch-blob/, /^formdata-polyfill/],
        importType: function (moduleName) {
            if (!_externalsCache.has(moduleName)) {
                console.log(`WEBPACK EXTERNAL (MAIN): [${moduleName}]`);
            }
            _externalsCache.add(moduleName);
            // if (moduleName === "normalize-url") {
            //     return "module normalize-url";
            // }
            return "commonjs " + moduleName;
        },
    });
    externals = [
        externals,
        function ({ context, request, contextInfo, getResolve }, callback) {
            const isRDesk = request.indexOf("readium-desktop/") === 0;
            if (isRDesk) {
                if (!_externalsCache.has(request)) {
                    console.log(`WEBPACK EXTERNAL (MAIN): READIUM-DESKTOP [${request}]`);
                }
                _externalsCache.add(request);

                return callback();
            }

            let request_ = request;
            if (aliases) {
                // const isR2 = /^r2-.+-js/.test(request);
                // const isR2Alias = /^@r2-.+-js/.test(request);

                const iSlash = request.indexOf("/");
                const key = request.substr(0, iSlash >= 0 ? iSlash : request.length);
                if (aliases[key]) {
                    request_ = request.replace(key, aliases[key]);

                    if (!_externalsCache.has(request)) {
                        console.log(`WEBPACK EXTERNAL (MAIN): ALIAS [${request}] => [${request_}]`);
                    }
                    _externalsCache.add(request);

                    return callback(null, "commonjs " + request_);
                }
            }

            neFunc(context, request, callback);
        },
    ];
}

console.log("WEBPACK externals (MAIN):", "-".repeat(200));
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
            libraryTarget: "commonjs2", // commonjs-module
        },
        target: "electron-main",

        node: {
            __dirname: false,
            __filename: false,
        },

        externalsPresets: { node: true },
        externals: externals,
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
                {
                    test: /\.tsx$/,
                    loader: useLegacyTypeScriptLoader ? "awesome-typescript-loader" : "ts-loader",
                    options: {
                        transpileOnly: true, // checkTypeScriptSkip
                        // compiler: "@typescript/native-preview",
                    },
                },
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
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "src", "resources", "information"),
                        to: "assets/md/information",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "node_modules", "pdf.js", "build", "gh-pages", "web"),
                        to: "assets/lib/pdfjs/web",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "node_modules", "pdf.js", "build", "gh-pages", "build"),
                        to: "assets/lib/pdfjs/build",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "external-assets"),
                        to: "external-assets",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "node_modules", "r2-navigator-js", "dist", "ReadiumCSS"),
                        to: "ReadiumCSS",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "node_modules", "mathjax"),
                        to: "MathJax",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "resources"),
                        to: "assets/icons",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, "src", "renderer", "assets", "fonts"),
                        to: "assets/fonts",
                    },
                ],
            }),
            preprocessorDirectives.definePlugin,
        ],
    },
);

config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^.\/runtime-fs$/ })); // jsondown (runtimejs, fatfs)

config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^canvas$/ })); // pdfjs

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

if (nodeEnv !== "production") {
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    config.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";

    config.output.pathinfo = true;

    config.devtool = "source-map";
} else {
    config.optimization = {
        ...(config.optimization || {}),
        nodeEnv: false,
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                exclude: /MathJax/,
                // parallel: 3,
                terserOptions: {
                    // sourceMap: nodeEnv !== "production" ? true : false,
                    sourceMap: false,
                    compress: {defaults:false, dead_code:true, booleans: true, passes: 1},
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
        }),
    );
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^remote-redux-devtools$/ }));
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^json-diff$/ }));
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
