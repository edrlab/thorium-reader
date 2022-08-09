const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
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
            new BundleAnalyzerPlugin({
                analyzerMode: "disabled",
                defaultSizes: "stat", // "parsed"
                openAnalyzer: false,
                generateStatsFile: true,
                statsFilename: "stats_renderer-preload.json",
                statsOptions: null,

                excludeAssets: null,
            }),
        ],
    },
);

config.optimization = {
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

module.exports = config;
