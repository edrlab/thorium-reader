const path = require("path");
const webpack = require("webpack");

// Default values for DEV environment
let nodeEnv = process.env.NODE_ENV || "DEV";
let pouchDbAdapterName = (nodeEnv === "DEV") ? "jsondown" : "leveldb";
let pouchDbAdapterPackage = (nodeEnv === "DEV") ?
    "readium-desktop/pouchdb/jsondown-adapter" : "pouchdb-adapter-leveldb";
let rendererBaseUrl = "file://";

if (nodeEnv === "DEV") {
    rendererBaseUrl = "http://localhost:8080/";
}

let definePlugin = new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(nodeEnv),
    __POUCHDB_ADAPTER_NAME__: JSON.stringify(pouchDbAdapterName),
    __POUCHDB_ADAPTER_PACKAGE__: JSON.stringify(pouchDbAdapterPackage),
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl),
});

// let ignorePlugin = new webpack.IgnorePlugin(new RegExp("/(bindings)/"))

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
        "bindings": "bindings",
        "electron-config": "electron-config",
        "conf": "conf",
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
