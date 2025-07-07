const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const TerserPlugin = require("terser-webpack-plugin");

var fs = require("fs");
const path = require("path");
const webpack = require("webpack");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`PRELOAD nodeEnv: ${nodeEnv}`);

let config = Object.assign(
    {},
    {
        entry: "./node_modules/r2-navigator-js/dist/es8-es2017/src/electron/renderer/webview/preload.js",
        name: "renderer webview preload",
        mode: nodeEnv,
        output: {
            filename: "preload.js",
            path: path.join(__dirname, "dist"),
            // https://github.com/webpack/webpack/issues/1114
            libraryTarget: "commonjs2", // commonjs-module
        },
        target: "electron-renderer",

        externalsPresets: { node: true },

        resolve: {
            extensions: [".js"],
        },

        plugins: [
        ],
    },
);

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
            },
        }),
    ],
};
// {
//     minimize: false,
// };

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
    name: 'renderer-preload',
    open: false,
    compressor: false,
}),
new BundleAnalyzerPlugin({
    analyzerMode: "disabled",
    defaultSizes: "stat", // "parsed"
    openAnalyzer: false,
    generateStatsFile: true,
    statsFilename: "stats_renderer-preload.json",
    statsOptions: null,

    excludeAssets: null,
}));

module.exports = config;
