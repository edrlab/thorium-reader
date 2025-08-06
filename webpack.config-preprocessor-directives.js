const webpack = require("webpack");

const { version, build, name } = require("./package.json");
// var git = require("git-rev-sync");

const portApp = process.env.PORT_APP || "8090";
const portReader = process.env.PORT_READER || "8191";
const portPdfWebview = process.env.PORT_PDF_WEBVIEW || "8292";

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
// const isDev = nodeEnv === "development";
const isDev = nodeEnv !== "production";
console.log(`PREPROCESSOR nodeEnv: ${nodeEnv} ${isDev}`);

const isContinuousIntegrationDeploy = process.env.GITHUB_TOKEN_RELEASE_PUBLISH ? true : false;

const rendererLibraryBaseUrl = isDev ? "http://localhost:" + portApp + "/" : "filex://host/";

const rendererReaderBaseUrl = isDev ? "http://localhost:" + portReader + "/" : "filex://host/";

const rendererPdfWebviewBaseUrl = isDev ? "http://localhost:" + portPdfWebview + "/" : "filex://host/";

const envPackaging = process.env.PACKAGING || "0";
const isPackaged = envPackaging === "1";

const nodeModuleRelativeUrl = isPackaged ? "node_modules" : "../node_modules";

const distRelativeUrl = isPackaged ? "dist" : "../dist";

// node scripts/profile-generate-key-pair.js 
const pubkey = `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBfuZMzJiHFuYrPHXkrzFvE4TLJCtt
KH2trb1daSymrTwrULHNVa68ci1du2qO1QCJfRyzXhM3Xb1EClcjLc7wQFgAaw+2
y9rrRYgNAPwvst6FjzS6ZSxNLmc+iubRYSpZaW4OOXk65cbwY1tcws2o+RtCoKlK
z/sqIdxiPLBfKh+CGU4=
-----END PUBLIC KEY-----
`;
const privateKey = `-----BEGIN PRIVATE KEY-----
MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIAmpB0szkvKDuibCa0
Wjex5O3pDgsgE2X2w1EsiEksLXZdSDTgMk32WUgcYnuHT0oE/FtrMPQVJEDzirjb
y8ZkCkGhgYkDgYYABAF+5kzMmIcW5is8deSvMW8ThMskK20ofa2tvV1pLKatPCtQ
sc1VrrxyLV27ao7VAIl9HLNeEzddvUQKVyMtzvBAWABrD7bL2utFiA0A/C+y3oWP
NLplLE0uZz6K5tFhKllpbg45eTrlxvBjW1zCzaj5G0KgqUrP+yoh3GI8sF8qH4IZ
Tg==
-----END PRIVATE KEY-----
`;

// "http://localhost:8080/";
// MUST END WITH FORWARD SLASH!
const telemetryUrl =
    isPackaged
        ?
        (
        process.env.THORIUM_TELEMETRY_URL ||
        (isContinuousIntegrationDeploy ?
            "https://telemetry-staging.edrlab.org/" :
            "https://telemetry.edrlab.org/")
        )
        :
        "";
const telemetrySecret = process.env.THORIUM_TELEMETRY_SECRET || "";

// const USE_HTTP_STREAMER = false;

const data = {
    // used for dead code removal (see typings.d.ts):
    __TH__IS_DEV__: JSON.stringify(isDev),
    __TH__IS_PACKAGED__: JSON.stringify(isPackaged),
    __TH__SKIP_LCP_LSD__: JSON.stringify(false && isDev),
    __TH__IS_VSCODE_LAUNCH__: JSON.stringify(process.env.VSCODE_LAUNCH === "true"),
    __TH__IS_CI__: JSON.stringify(isContinuousIntegrationDeploy),

    "process.env.NODE_ENV": JSON.stringify(nodeEnv),

    // used as constants (see preprocessor-directives.ts):
    __TH__APP_VERSION__: JSON.stringify(version),
    __TH__PACK_NAME__: JSON.stringify(name), // EDRLab.ThoriumReader
    __TH__APP_NAME__: JSON.stringify(build.productName), // Thorium
    __TH__NODE_MODULE_RELATIVE_URL__: JSON.stringify(nodeModuleRelativeUrl),
    __TH__DIST_RELATIVE_URL__: JSON.stringify(distRelativeUrl),
    __TH__RENDERER_LIBRARY_BASE_URL__: JSON.stringify(rendererLibraryBaseUrl),
    __TH__RENDERER_READER_BASE_URL__: JSON.stringify(rendererReaderBaseUrl),
    __TH__RENDERER_PDF_WEBVIEW_BASE_URL__: JSON.stringify(rendererPdfWebviewBaseUrl),
    __TH__TELEMETRY_URL__: JSON.stringify(telemetryUrl),
    __TH__TELEMETRY_SECRET__: JSON.stringify(telemetrySecret),
    __TH__CUSTOMIZATION_PROFILE_PUB_KEY__: JSON.stringify(pubkey),
    __TH__CUSTOMIZATION_PROFILE_PRIVATE_KEY__: JSON.stringify(privateKey),

    // __PACKAGING__: JSON.stringify(envPackaging),
    // __NODE_ENV__: JSON.stringify(nodeEnv),
    // __GIT_BRANCH__: JSON.stringify(git.branch()),
    // __GIT_DATE__: JSON.stringify(git.date()),
    // __GIT_SHORT__: JSON.stringify(git.short()),
    // __USE_HTTP_STREAMER__: JSON.stringify(USE_HTTP_STREAMER),
};

// we do not replace "process.env.NODE_ENV" at build-time,
// because we check actual runtime env vars
// when __PACKAGING__ === "0" && __NODE_ENV__ === "PROD" (npm run start)
// if (envPackaging !== "1") {
//     // data["process.env.THORIUM_OPEN_DEVTOOLS"] = JSON.stringify("0");
//     // data["process.env.LCP_SKIP_LSD"] = JSON.stringify("0");
//     // data["process.env.DEBUG"] = "0"; // Terser crash, there is a delete process.env.DEBUG in third-party code
// }

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
