const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const preprocessorDirectives = require("./webpack.config-preprocessor-directives");

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";

// let ignorePlugin = new webpack.IgnorePlugin(new RegExp("/(bindings)/"))

const aliases = {
    "readium-desktop": path.resolve(__dirname, "src"),

    "@r2-utils-js": "r2-utils-js/dist/es6-es2015/src",
    "@r2-lcp-js": "r2-lcp-js/dist/es6-es2015/src",
    "@r2-opds-js": "r2-opds-js/dist/es6-es2015/src",
    "@r2-shared-js": "r2-shared-js/dist/es6-es2015/src",
    "@r2-streamer-js": "r2-streamer-js/dist/es6-es2015/src",
    "@r2-navigator-js": "r2-navigator-js/dist/es6-es2015/src",
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
    "yargs": "yargs",
    "fsevents": "fsevents",
    "conf": "conf",
    "pouchdb-adapter-leveldb": "pouchdb-adapter-leveldb",
    "electron-devtools-installer": "electron-devtools-installer",
}
if (nodeEnv !== "production") {
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
    mode: nodeEnv,
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
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loaders: ["awesome-typescript-loader"] },
            { test: /\.node$/, loaders: ["node-loader"] },
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "src", "resources", "information"),
                to: "assets/md/information",
            }
        ]),
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
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "node_modules", "mathjax"),
                to: "MathJax",
            }
        ]),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "resources"),
                to: "assets/icons",
            }
        ]),
        preprocessorDirectives.definePlugin
    ],
});

config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^.\/runtime-fs$/ })); // jsondown (runtimejs, fatfs)

if (nodeEnv !== "production") {
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    config.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";

    config.output.pathinfo = true;

    config.devtool = "source-map";
} else {
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^electron-devtools-installer$/ }));
}

module.exports = config;
