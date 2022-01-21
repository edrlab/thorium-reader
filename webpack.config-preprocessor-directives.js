const webpack = require("webpack");

const { version, build } = require("./package.json");
var git = require("git-rev-sync");

const portApp = process.env.PORT_APP || "8090";
const portReader = process.env.PORT_READER || "8191";
const portPdfWebview = process.env.PORT_PDF_WEBVIEW || "8292";

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
console.log(`PREPROCESSOR nodeEnv: ${nodeEnv}`);
const isDev = nodeEnv === "development";

const isVisualStudioCodeLaunch = process.env.VSCODE_LAUNCH || "false";

const isContinuousIntegrationDeploy = process.env.TRAVIS_OS_NAME_ ? true : false;

const rendererLibraryBaseUrl = isDev ?
    ("http://localhost:"+portApp+"/") : "file://";

const rendererReaderBaseUrl = isDev ?
    ("http://localhost:"+portReader+"/") : "file://";

const rendererPdfWebviewBaseUrl = isDev ?
    ("http://localhost:"+portPdfWebview+"/") : "file://";

const isPackaging = process.env.PACKAGING || "0";

const nodeModuleRelativeUrl = (isPackaging === "1") ?
    "node_modules" : "../node_modules";

const distRelativeUrl = (isPackaging === "1") ?
    "dist" : "../dist";

// const USE_HTTP_STREAMER = false;

const data = {
    __APP_VERSION__: JSON.stringify(version),
    __APP_NAME__: JSON.stringify(build.productName),
    __GIT_BRANCH__: JSON.stringify(git.branch()),
    __GIT_DATE__: JSON.stringify(git.date()),
    __GIT_SHORT__: JSON.stringify(git.short()),
    __NODE_ENV__: JSON.stringify(nodeEnv),
    __VSCODE_LAUNCH__: JSON.stringify(isVisualStudioCodeLaunch),
    __NODE_MODULE_RELATIVE_URL__: JSON.stringify(nodeModuleRelativeUrl),
    __DIST_RELATIVE_URL__: JSON.stringify(distRelativeUrl),
    __PACKAGING__: JSON.stringify(isPackaging),
    __RENDERER_LIBRARY_BASE_URL__: JSON.stringify(rendererLibraryBaseUrl),
    __RENDERER_READER_BASE_URL__: JSON.stringify(rendererReaderBaseUrl),
    __RENDERER_PDF_WEBVIEW_BASE_URL__: JSON.stringify(rendererPdfWebviewBaseUrl),
    __CONTINUOUS_INTEGRATION_DEPLOY__: JSON.stringify(isContinuousIntegrationDeploy),
    // __USE_HTTP_STREAMER__: JSON.stringify(USE_HTTP_STREAMER),
};

// we do not replace "process.env.NODE_ENV" at build-time,
// because we check actual runtime env vars
// when __PACKAGING__ === "0" && __NODE_ENV__ === "PROD" (npm run start)
if (false) {
    data["process.env.NODE_ENV"] = JSON.stringify(nodeEnv);
}

const definePlugin = new webpack.DefinePlugin(data);
module.exports = {
    definePlugin,
    portApp,
    portReader,
    portPdfWebview,
    rendererLibraryBaseUrl,
    rendererReaderBaseUrl,
    rendererPdfWebviewBaseUrl,
};
