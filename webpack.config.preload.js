var fs = require("fs");
const path = require("path");
const webpack = require("webpack");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";

let config = Object.assign({}, {
    entry: "./node_modules/r2-navigator-js/dist/es6-es2015/src/electron/renderer/webview/preload.js",
    name: "renderer webview preload",
    mode: nodeEnv,
    output: {
        filename: "preload.js",
        path: path.join(__dirname, "dist"),
        // https://github.com/webpack/webpack/issues/1114
        libraryTarget: "commonjs2",
    },
    target: "electron-renderer",

    resolve: {
        extensions: [".js"]
    }
});

module.exports = config;
