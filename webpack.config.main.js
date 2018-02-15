const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Default values for DEV environment
let isPackaging = process.env.PACKAGING || "0";
let forceDebug = process.env.FORCEDEBUG || "0";
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

if (isPackaging === "1") {
    nodeModuleRelativeUrl = "node_modules";
}

let definePlugin = new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(nodeEnv),
    __PACKAGING__: JSON.stringify(isPackaging),
    __POUCHDB_ADAPTER_NAME__: JSON.stringify(pouchDbAdapterName),
    __POUCHDB_ADAPTER_PACKAGE__: JSON.stringify(pouchDbAdapterPackage),
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl),
    __NODE_MODULE_RELATIVE_URL__: JSON.stringify(nodeModuleRelativeUrl),
    __FORCEDEBUG__: JSON.stringify(forceDebug),

    // we test for *runtime* process.env.NODE_ENV when (__PACKAGING__ === "0" && __NODE_ENV__ === "PROD")
    // so that we can debug the generated bundles (main + renderers) using the Chromium web inspector.
    // e.g. `NODE_ENV=dev npm run start` (which is different than 'npm run start:dev' because there is no WebPack HMR server, and no externals)
    // "process.env.NODE_ENV": JSON.stringify(nodeEnv),
});

// let ignorePlugin = new webpack.IgnorePlugin(new RegExp("/(bindings)/"))

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es6-es2015/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es6-es2015/src",
    "@r2-opds-js": "r2-opds-js/dist/es6-es2015/src",
    "@r2-shared-js": "r2-shared-js/dist/es6-es2015/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es6-es2015/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es6-es2015/src",
    "@r2-testapp-js": "r2-testapp-js/dist/es6-es2015/src",
};

////// ================================
////// EXTERNALS
// Some modules cannot be bundled by Webpack
// for example those that make internal use of NodeJS require() in special ways
// in order to resolve asset paths, etc.
// In DEBUG / DEV mode, we just external-ize as much as possible (any non-TypeScript / non-local code),
// to minimize bundle size / bundler computations / compile times.

let externals = {
    "bindings": "bindings",
    "leveldown": "leveldown",
    "fsevents": "fsevents",
    "conf": "conf",
    "pouchdb-adapter-leveldb": "pouchdb-adapter-leveldb",
    "electron-devtools-installer": "electron-devtools-installer",
}
if (nodeEnv === "DEV") {
    // // externals = Object.assign(externals, {
    // //         "electron-config": "electron-config",
    // //     }
    // // );
    // const { dependencies } = require("./package.json");
    // const depsKeysArray = Object.keys(dependencies || {});
    // const depsKeysObj = {};
    // depsKeysArray.forEach((depsKey) => { depsKeysObj[depsKey] = depsKey });
    // externals = Object.assign(externals, depsKeysObj);
    // delete externals["pouchdb-core"];


    // if (process.env.WEBPACK === "bundle-external") {
    const nodeExternals = require("./nodeExternals");
    externals = [
        nodeExternals(
            {
                processName: "MAIN",
                alias: aliases,
                // whitelist: ["pouchdb-core"],
            }
        ),
    ];
    // } else {
    //     const nodeExternals = require("webpack-node-externals");
    //     // electron-devtools-installer
    //     externals = [nodeExternals()];
    // }
}

console.log("WEBPACK externals (MAIN):");
console.log(JSON.stringify(externals, null, "  "));
////// EXTERNALS
////// ================================



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
        alias: aliases,
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
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "node_modules", "r2-navigator-js", "dist", "ReadiumCSS"),
                to: "ReadiumCSS",
            }
        ]),
        definePlugin
    ],
});

if (nodeEnv === "DEV") {
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    config.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";

    config.output.pathinfo = true;

    config.devtool = "source-map";
}

module.exports = config;
