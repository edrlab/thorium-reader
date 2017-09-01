const path = require("path");
const webpack = require("webpack");

// Default values for DEV environment
let nodeEnv = process.env.NODE_ENV || "DEV";
let rendererBaseUrl = "file://";

let definePlugin = new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(nodeEnv),
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl),
});

let config = Object.assign({}, {
    entry: "./src/main.ts",
    name: "main",
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

    // Webpack is unable to manage native modules
    externals: {
        "leveldown": "leveldown",
    },

    resolve: {
        // Add '.ts' as resolvable extensions.
        extensions: [".ts", ".js", ".node"],
        alias: {
            "readium-desktop": path.resolve(__dirname, "src"),
        },
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
                { test: /\.tsx?$/, loaders: ["awesome-typescript-loader"] },
                { test: /\.node$/, loaders: ["node-loader"] },
        ],
    },
    plugins: [
        definePlugin,
    ],
});

module.exports = config;
