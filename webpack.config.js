const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
//const CopyWebpackPlugin = require("copy-webpack-plugin");

// Default values for DEV environment
let buildEnv = process.env.BUILD_ENV || "DEV";
let rendererBaseUrl = "file://";

let definePlugin = new webpack.DefinePlugin({
    __RENDERER_BASE_URL__: JSON.stringify(rendererBaseUrl)
});

let mainConfig = Object.assign({}, {
    entry: "./src/main.ts",
    name: "main",
    output: {
        filename: "main.js",
        path: path.join(__dirname, "dist"),
    },
    target: "electron-main",

    node: {
        __dirname: false,
        __filename: false,
    },

    resolve: {
        // Add '.ts' as resolvable extensions.
        extensions: [".ts", ".js"],
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loaders: ["awesome-typescript-loader"] },
        ],
    },
    plugins: [
        definePlugin,
    ],
});

let rendererConfig = Object.assign({}, {
    entry: "./src/renderer.ts",
    name: "renderer",
    output: {
        filename: "renderer.js",
        path: path.join(__dirname, "dist"),
    },
    target: "electron-renderer",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },

    module: {
        loaders: [
            {
                loaders: ["react-hot-loader", "awesome-typescript-loader"],
                test: /\.tsx?$/,
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader",
                }),
            },
            {
                loader: "file-loader?name=assets/[name].[hash].[ext]",
                test: /\.(png|jpe?g|gif|ico)$/,
            },
            {
                loader: "file-loader?name=assets/[name].[hash].[ext]",
                test: /\.(woff|woff2|ttf|eot|svg)$/,
            },
        ],
    },

    devServer: {
        contentBase: __dirname,
        hot: true,
        watchContentBase: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.ejs",
        }),
        new ExtractTextPlugin("styles.css"),
        // new CopyWebpackPlugin([{
        //     context: "./src/resources",
        //     from: "**/*",
        //     to: "./resources",
        // }]),
        definePlugin,
    ],
});

if (buildEnv == "DEV") {
    // Main config for DEV environment
    mainConfig.output.publicPath = "http://localhost:8080/dist/";

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

    rendererConfig.output.publicPath = "http://localhost:8080/dist/";
    rendererConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports =  [
    mainConfig, rendererConfig
];
