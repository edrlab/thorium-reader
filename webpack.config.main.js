const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { dependencies } = require("./package.json");

// Default values for DEV environment
let isPackaging = process.env.PACKAGING;
let nodeEnv = process.env.NODE_ENV || "DEV";
let pouchDbAdapterName = (nodeEnv === "DEV") ? "jsondown" : "leveldb";
let pouchDbAdapterPackage = (nodeEnv === "DEV") ?
    "readium-desktop/pouchdb/jsondown-adapter" : "pouchdb-adapter-leveldb";
let rendererBaseUrl = "file://";

// Node module relative url from main
let nodeModuleRelativeUrl = "../node_modules";

if (nodeEnv === "DEV") {
    rendererBaseUrl = "http://localhost:8080/";
}

if (isPackaging) {
    nodeModuleRelativeUrl = "node_modules"
}

let definePlugin = new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(nodeEnv),
    __POUCHDB_ADAPTER_NAME__: JSON.stringify(pouchDbAdapterName),
    __POUCHDB_ADAPTER_PACKAGE__: JSON.stringify(pouchDbAdapterPackage),
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl),
    __NODE_MODULE_RELATIVE_URL__: JSON.stringify(nodeModuleRelativeUrl),
});

// let ignorePlugin = new webpack.IgnorePlugin(new RegExp("/(bindings)/"))


// Webpack is unable to manage native modules
let externals = {
    "leveldown": "leveldown",
    "conf": "conf"
}

if (nodeEnv === "DEV") {
    console.log("WEBPACK externals (dev)");
    externals = Object.assign(externals, {
        "bindings": "bindings",
        "electron-config": "electron-config",
        }
    );
    const depsKeysArray = Object.keys(dependencies || {});
    const depsKeysObj = {};
    depsKeysArray.forEach((depsKey) => { depsKeysObj[depsKey] = depsKey });
    externals = Object.assign(externals, depsKeysObj);
    delete externals["pouchdb-core"];
}
console.log(JSON.stringify(externals, null, "  "));

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

    externals: externals,

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
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "external-assets"),
                to: "external-assets",
            }
        ]),
        definePlugin
    ],
});

module.exports = config;
