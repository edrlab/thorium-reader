const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es8-es2017/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es8-es2017/src",
    "@r2-opds-js": "r2-opds-js/dist/es8-es2017/src",
    "@r2-shared-js": "r2-shared-js/dist/es8-es2017/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es8-es2017/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es8-es2017/src",
};

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
    "electron-devtools-installer": "electron-devtools-installer",
    "remote-redux-devtools": "remote-redux-devtools",
    "electron": "electron",
    yargs: "yargs",
};
const _externalsCache = new Set();
if (nodeEnv !== "production") {
    const nodeExternals = require("webpack-node-externals");
    const neFunc = nodeExternals({
        allowlist: ["normalize-url"],
        importType: function (moduleName) {
            if (!_externalsCache.has(moduleName)) {
                console.log(`WEBPACK EXTERNAL (PDF): [${moduleName}]`);
            }
            _externalsCache.add(moduleName);
            // if (moduleName === "normalize-url") {
            //     return "module normalize-url";
            // }
            return "commonjs " + moduleName;
        },
    });
    externals = [externals,
        function({ context, request, contextInfo, getResolve }, callback) {
            const isRDesk = request.indexOf("readium-desktop/") === 0;
            if (isRDesk) {

                if (!_externalsCache.has(request)) {
                    console.log(`WEBPACK EXTERNAL (PDF): READIUM-DESKTOP [${request}]`);
                }
                _externalsCache.add(request);

                return callback();
            }

            let request_ = request;
            if (aliases) {
                // const isR2 = /^r2-.+-js/.test(request);
                // const isR2Alias = /^@r2-.+-js/.test(request);

                const iSlash = request.indexOf("/");
                const key = request.substr(0, (iSlash >= 0) ? iSlash : request.length);
                if (aliases[key]) {
                    request_ = request.replace(key, aliases[key]);

                    if (!_externalsCache.has(request)) {
                        console.log(`WEBPACK EXTERNAL (PDF): ALIAS [${request}] => [${request_}]`);
                    }
                    _externalsCache.add(request);

                    return callback(null, "commonjs " + request_);
                }
            }

            neFunc(context, request, callback);
        },
    ];
}

console.log("WEBPACK externals (PDF):", "-".repeat(200));
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
            libraryTarget: "commonjs2", // commonjs-module
        },
        target: "electron-renderer",

        mode: "production", // nodeEnv,

        externalsPresets: { node: true },
        externals: externals,
        externalsType: "commonjs", // module, node-commonjs
        experiments: {
            outputModule: false, // module, node-commonjs
        },

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
