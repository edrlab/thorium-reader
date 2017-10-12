const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Default values for DEV environment
let nodeEnv = process.env.NODE_ENV || "DEV";

let definePlugin = new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(nodeEnv),
});

let config = Object.assign({}, {
    entry: "./src/renderer.ts",
    name: "renderer",
    output: {
        filename: "renderer.js",
        path: path.join(__dirname, "dist"),
        // https://github.com/webpack/webpack/issues/1114
        libraryTarget: "commonjs2",
    },
    target: "electron-renderer",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        alias: {
            "readium-desktop": path.resolve(__dirname, "src"),
        },
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
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "reader-NYPL", "sw.js"),
                to: "sw.js",
            },
        ]),
        new ExtractTextPlugin("styles.css"),
        definePlugin,
    ],
});

if (nodeEnv === "DEV") {
    // Renderer config for DEV environment
    config = Object.assign({}, config, {
        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        devServer: {
            contentBase: __dirname,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            hot: true,
            watchContentBase: true,
        },
    });

    config.output.publicPath = "http://localhost:8080/";
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = config;
