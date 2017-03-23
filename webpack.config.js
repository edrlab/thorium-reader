const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Default values for DEV environment
let buildEnv = process.env.BUILD_ENV || 'DEV';
let rendererBaseUrl = "file://"

let definePlugin = new webpack.DefinePlugin({
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl)
});

let mainConfig = Object.assign({}, {
    name: "main",
    entry: "./src/main.ts",
    output: {
        filename: "main.js",
        path: path.join(__dirname, "dist")
    },
    target: "electron-main",

    node: {
        __filename: false,
        __dirname: false
    },

    resolve: {
        // Add '.ts' as resolvable extensions.
        extensions: [".ts", ".js"]
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loaders: ["awesome-typescript-loader"] }
        ]
    },
    plugins: [
        definePlugin
    ]
});

let rendererConfig = Object.assign({}, {
    name: "renderer",
    entry: "./src/renderer.ts",
    output: {
        filename: "renderer.js",
        path: path.join(__dirname, "dist")
    },
    target: "electron-renderer",

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loaders: ["react-hot-loader", "awesome-typescript-loader"] }
        ]
    },

    devServer: {
        contentBase: __dirname,
        hot: true,
        watchContentBase: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.ejs"
        }),
        definePlugin
    ]
});

if (buildEnv == "DEV") {
    // Main config for DEV environment
    mainConfig.output.publicPath = 'http://localhost:8080/dist/';

    // Renderer config for DEV environment
    rendererConfig = Object.assign({}, rendererConfig, {
        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        devServer: {
            contentBase: __dirname,
            hot: true,
            watchContentBase: true
        }
    });

    rendererConfig.output.publicPath = 'http://localhost:8080/dist/';
    rendererConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports =  [
    mainConfig, rendererConfig
];
