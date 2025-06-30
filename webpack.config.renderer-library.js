// const crypto = require("crypto");

const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const TerserPlugin = require("terser-webpack-plugin");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

let __WEBPACK_SASS_LOADER_FIRST_LIBRARY = false;

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es8-es2017/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es8-es2017/src",
    "@r2-opds-js": "r2-opds-js/dist/es8-es2017/src",
    "@r2-shared-js": "r2-shared-js/dist/es8-es2017/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es8-es2017/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es8-es2017/src",
};

const _enableHot = true;

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`LIBRARY nodeEnv: ${nodeEnv}`);

// https://github.com/edrlab/thorium-reader/issues/1097#issuecomment-643406149
const useLegacyTypeScriptLoader = process.env.USE_LEGACY_TYPESCRIPT_LOADER ? true : false;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
ForkTsCheckerWebpackPlugin.prototype[require("util").inspect.custom] = (_depth, _options) => {
    return "ForkTsCheckerWebpackPlugin";
};
const checkTypeScriptSkip =
    nodeEnv !== "production" ? (process.env.SKIP_CHECK_TYPESCRIPT === "1" ? true : false) : false;
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
        allowlist: ["marked", "color", "pdf.js", "readium-speech", "@github/paste-markdown", "yargs", "timeout-signal", "nanoid", "normalize-url", "node-fetch", "data-uri-to-buffer", /^fetch-blob/, /^formdata-polyfill/],
        importType: function (moduleName) {
            if (!_externalsCache.has(moduleName)) {
                console.log(`WEBPACK EXTERNAL (LIBRARY): [${moduleName}]`);
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
                    console.log(`WEBPACK EXTERNAL (LIBRARY): READIUM-DESKTOP [${request}]`);
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
                        console.log(`WEBPACK EXTERNAL (LIBRARY): ALIAS [${request}] => [${request_}]`);
                    }
                    _externalsCache.add(request);

                    return callback(null, "commonjs " + request_);
                }
            }

            neFunc(context, request, callback);
        },
    ];
}

console.log("WEBPACK externals (LIBRARY):", "-".repeat(200));
console.log(JSON.stringify(externals, null, "  "));
////// EXTERNALS
////// ================================

// const cssLoaderConfig = [
//     {
//         loader: nodeEnv !== "production" ? "style-loader" : MiniCssExtractPlugin.loader,
//         options: {
//             // publicPath: "./styling", // preprocessorDirectives.rendererReaderBaseUrl,
//             // hmr: _enableHot,
//             // reloadAll: true,
//             esModule: false,
//         },
//     },
//     {
//         loader: "css-loader",
//         options: {
//             url: false,
//             import: {
//                 filter: (url, media, resourcePath) => {
//                     console.log("css-loader IMPORT (LIBRARY): ", url, media, resourcePath);
//                     return true;
//                 },
//             },
//             importLoaders: 1,
//             modules: {
//                 // auto: false,
//                 // mode: "local",
//                 // exportOnlyLocals: true,
//                 // exportGlobals: true,
//                 namedExport: false,
//                 exportLocalsConvention: 'as-is',
//                 localIdentName: "[local]",
//             },
//             // modules: nodeEnv !== "production" && false ? { // MUST USE STRICT BASE64, NO PATH DEPENDENT (OTHERWISE BREAK CROSS-FILE CSS CLASSES WITH IDENTICAL NAMES, E.G. SUBCLASSES IN NESTED STATEMENTS)
//             //     localIdentName: "[path][name]__[local]--[contenthash:base64:5]",
//             // } : {
//             //     getLocalIdent: (context, localIdentName, localName, options) => {
//             //         // const checkSum = crypto.createHash("sha256");
//             //         // checkSum.update(localName);
//             //         // const hexStr = checkSum.digest("hex");
//             //         // const b64Str = Buffer.from(hexStr, "hex").toString("base64");
//             //         // const h = "z_" + b64Str;
//             //         // console.log("getLocalIdent LIBRARY: ", h, context.resourcePath, localName);
//             //         // return h;
//             //         return localName;
//             //     },
//             //     // localIdentName: "[contenthash:base64]",
//             //     // localIdentHashPrefix: "contenthash",
//             //     // localIdentHashSalt: "_",
//             //     // localIdentHashFunction: "md4", // sha256
//             //     // localIdentHashDigest: "hex", // base64
//             //     // localIdentHashDigestLength: 20,
//             // },
//             esModule: false,
//         },
//     },
//     "postcss-loader",
// ];

const scssLoaderConfig = [
    {
        loader: nodeEnv !== "production" ? "style-loader" : MiniCssExtractPlugin.loader,
        options: {
            // publicPath: "./styling", // preprocessorDirectives.rendererReaderBaseUrl,
            // hmr: _enableHot,
            // reloadAll: true,
            esModule: false,
        },
    },
    {
        loader: "css-loader",
        options: {
            url: false,
            import: {
                filter: (url, media, resourcePath) => {
                    console.log("css-loader IMPORT (LIBRARY): ", url, media, resourcePath);
                    return true;
                },
            },
            importLoaders: 1,
            modules: {
                // auto: false,
                // mode: "local",
                // exportOnlyLocals: true,
                // exportGlobals: true,
                namedExport: false,
                exportLocalsConvention: 'as-is',
                localIdentName: "[local]",
            },
            // modules: nodeEnv !== "production" && false ? { // MUST USE STRICT BASE64, NO PATH DEPENDENT (OTHERWISE BREAK CROSS-FILE CSS CLASSES WITH IDENTICAL NAMES, E.G. SUBCLASSES IN NESTED STATEMENTS)
            //     localIdentName: "[path][name]__[local]--[contenthash:base64:5]",
            // } : {
            //     getLocalIdent: (context, localIdentName, localName, options) => {
            //         // const checkSum = crypto.createHash("sha256");
            //         // checkSum.update(localName);
            //         // const hexStr = checkSum.digest("hex");
            //         // const b64Str = Buffer.from(hexStr, "hex").toString("base64");
            //         // const h = "z_" + b64Str;
            //         // console.log("getLocalIdent LIBRARY: ", h, context.resourcePath, localName);
            //         // return h;
            //         return localName;
            //     },
            //     // localIdentName: "[contenthash:base64]",
            //     // localIdentHashPrefix: "contenthash",
            //     // localIdentHashSalt: "_",
            //     // localIdentHashFunction: "md4", // sha256
            //     // localIdentHashDigest: "hex", // base64
            //     // localIdentHashDigestLength: 20,
            // },
            esModule: false,
        },
    },
    {
        loader: "sass-loader",
        options: {
            // api: "legacy",
            // Prefer `dart-sass`
            implementation: require("sass"),
            additionalData: (content, loaderContext) => {
                console.log("SASS LOADER (LIBRARY): " + loaderContext.resourcePath);
                if (!__WEBPACK_SASS_LOADER_FIRST_LIBRARY) {
                    __WEBPACK_SASS_LOADER_FIRST_LIBRARY = true;
                    console.log("[first] SASS LOADER (LIBRARY)");

                    // -----
                    // WORKS, but not tested in Windows (different root path syntax for import?)
                    // const { rootContext } = loaderContext; // resourcePath
                    // const importPath = path.join(rootContext, "src/renderer/assets/styles/partials/variables.scss");
                    // // const relativePath = path.relative(rootContext, resourcePath);
                    // // console.log("CSSSASS", rootContext, resourcePath, relativePath, importPath);
                    // return `@import "${importPath}"`;
                    // -----
                    // WORKS
                    // const prefix = fs.readFileSync(path.join(process.cwd(), "src/renderer/assets/styles/partials/variables.scss"), { encoding: "utf8" });
                    // return `\n/* src/renderer/assets/styles/partials/variables.scss */\n\n${prefix}\n${content}`;
                    // -----
                    // DOES NOT WORK
                    // return `@import "src/renderer/assets/styles/partials/variables"`;
                    // -----
                    // DOES NOT WORK
                    // return `@import "src/renderer/assets/styles/partials/variables.scss"`;
                    // -----
                }
                return content;
            },
            warnRuleAsWarning: true,
        },
    },
];

let config = Object.assign(
    {},
    {
        entry: "./src/renderer/library/index_library.ts",
        name: "renderer index app",
        output: {
            filename: "index_library.js",
            path: path.join(__dirname, "dist"),
            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2", // commonjs-module
        },
        target: "electron-renderer",

        mode: nodeEnv,

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
                            loader: path.resolve("./scripts/webpack-loader-scope-checker.js"),
                            options: {
                                forbids: ["src/renderer/reader", "src/main"],
                            },
                        },
                    ],
                },
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
                {
                    // loader: "file-loader?name=assets/[name].[contenthash][ext]",
                    // type: 'javascript/auto',
                    // options: {
                    //     esModule: false,
                    // },
                    test: /\.(png|jpe?g|gif|ico)$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/[name].[contenthash][ext]",
                    },
                },
                {
                    exclude: /node_modules/,
                    loader: "svg-sprite-loader",
                    test: /\.svg$/,
                },
                {
                    test: /\.ttf$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/fonts/[name][ext]",
                    },
                },
                // useful ?
                {
                    exclude: /src/,
                    // loader: "file-loader?name=assets/[name].[contenthash][ext]",
                    // type: 'javascript/auto',
                    // options: {
                    //     esModule: false,
                    //     outputPath: "fonts",
                    // },
                    test: /\.(woff|woff2|ttf|eot|svg)$/,
                    type: "asset/resource",
                    generator: {
                        filename: "assets/[name].[contenthash][ext]",
                    },
                },
                {
                    exclude: /node_modules/,
                    test: /\.md$/,
                    use: [
                        {
                            loader: "html-loader",
                        },
                        {
                            loader: "markdown-loader",
                        },
                    ],
                },
            ],
        },

        devServer: {
            static: {
                directory: __dirname,
                publicPath: "/",
                watch: {
                    ignored: [/dist/, /docs/, /scripts/, /test/, /node_modules/, /external-assets/, /\.flox/],
                },
            },
            devMiddleware: {
                publicPath: "/",
            },
            hot: _enableHot,
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/renderer/library/index_library.ejs",
                filename: "index_library.html",
            }),
            preprocessorDirectives.definePlugin,
        ],
    },
);


if (checkTypeScriptSkip) {
    // const GoTsCheckerWebpackPlugin = require("./scripts/go-ts-checker-webpack-plugin");
    // config.plugins.push(
    //     new GoTsCheckerWebpackPlugin({name: "LIBRARY"}), // we use a single-pass fast-compile/typecheck in this LIBRARY watcher, no need in READER (and MAIN + PDF configs do not activate a watcher)
    // );
} else {
    config.plugins.push(
        new ForkTsCheckerWebpackPlugin({
            // measureCompilationTime: true,
        }),
    );
}

if (nodeEnv !== "production") {
    const port = parseInt(preprocessorDirectives.portApp, 10);
    console.log("APP PORT: " + port);

    // Renderer config for DEV environment
    config = Object.assign({}, config, {
        // Enable sourcemaps for debugging webpack's output.
        devtool: "inline-source-map",

        devServer: {
            static: {
                directory: __dirname,
                publicPath: "/",
                watch: {
                    ignored: [/dist/, /docs/, /scripts/, /test/, /node_modules/, /external-assets/, /\.flox/],
                },
            },
            devMiddleware: {
                publicPath: "/",
            },
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            hot: _enableHot,
            port,
        },
    });

    config.output.pathinfo = true;

    // same as devServer.devMiddleware.publicPath
    // preprocessorDirectives.rendererLibraryBaseUrl (full HTTP locahost + port)
    config.output.publicPath = "/";

    // if (_enableHot) {
    //     config.plugins.push(new webpack.HotModuleReplacementPlugin());
    // }
    // if (_enableHot) {
    //     cssLoaderConfig.unshift("css-hot-loader");
    // }
    // config.module.rules.push({
    //     test: /\.css$/,
    //     use: cssLoaderConfig,
    // });
    config.module.rules.push({
        test: /\.scss$/,
        use: scssLoaderConfig,
    });
} else {
    config.optimization = {
        ...(config.optimization || {}),
        nodeEnv: false,
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                exclude: /MathJax/,
                terserOptions: {
                    compress: {defaults:false, dead_code:true, booleans: true, passes: 1},
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
        new MiniCssExtractPlugin({
            filename: "styles_library.css",
        }),
    );

    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^devtron$/ }));
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@axe-core\/react$/ }));

    // Minify and uglify in production environment
    //config.plugins.push(new UglifyJsPlugin());
    // config.module.rules.push({
    //     test: /\.css$/,
    //     use: cssLoaderConfig,
    // });
    config.module.rules.push({
        test: /\.scss$/,
        use: scssLoaderConfig,
    });
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
    name: 'renderer-library',
    open: false,
    compressor: false,
}),
new BundleAnalyzerPlugin({
    analyzerMode: "disabled",
    defaultSizes: "stat", // "parsed"
    openAnalyzer: false,
    generateStatsFile: true,
    statsFilename: "stats_renderer-library.json",
    statsOptions: null,

    excludeAssets: null,
}));

module.exports = config;
